using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("proxy", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();
app.UseCors();

var serviceMap = new Dictionary<string, string>
{
    ["auth"] = Environment.GetEnvironmentVariable("AUTH_SERVICE_URL") ?? "http://localhost:5100",
    ["cinema"] = Environment.GetEnvironmentVariable("CINEMA_SERVICE_URL") ?? "http://localhost:5101",
    ["order"] = Environment.GetEnvironmentVariable("ORDER_SERVICE_URL") ?? "http://localhost:5102"
};

var fallbackMap = new Dictionary<string, string[]>
{
    ["auth"] = ["http://host.docker.internal:5100", "http://localhost:5100"],
    ["cinema"] = ["http://host.docker.internal:5101", "http://localhost:5101"],
    ["order"] = ["http://host.docker.internal:5102", "http://localhost:5102"]
};

var prefixMap = new Dictionary<string, string>
{
    ["auth"] = "api/auth",
    ["cinema"] = "api",
    ["order"] = ""
};

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    services = serviceMap,
    service_candidates = serviceMap.Keys.ToDictionary(name => name, GetServiceUrls)
}));

app.MapMethods("/auth/{**path}", SupportedMethods(), (HttpContext context, IHttpClientFactory factory, string? path) =>
    Forward("auth", path ?? "", context, factory));
app.MapMethods("/auth", SupportedMethods(), (HttpContext context, IHttpClientFactory factory) =>
    Forward("auth", "", context, factory));

app.MapMethods("/cinema/{**path}", SupportedMethods(), (HttpContext context, IHttpClientFactory factory, string? path) =>
    Forward("cinema", path ?? "", context, factory));
app.MapMethods("/cinema", SupportedMethods(), (HttpContext context, IHttpClientFactory factory) =>
    Forward("cinema", "", context, factory));

app.MapMethods("/order/{**path}", SupportedMethods(), (HttpContext context, IHttpClientFactory factory, string? path) =>
    Forward("order", path ?? "", context, factory));
app.MapMethods("/order", SupportedMethods(), (HttpContext context, IHttpClientFactory factory) =>
    Forward("order", "", context, factory));

app.Run();

async Task<IResult> Forward(string serviceName, string path, HttpContext context, IHttpClientFactory factory)
{
    if (HttpMethods.IsOptions(context.Request.Method))
        return Results.NoContent();

    var client = factory.CreateClient("proxy");
    var attemptedUrls = new List<string>();
    Exception? lastError = null;

    foreach (var baseUrl in GetServiceUrls(serviceName))
    {
        var targetUrl = BuildTargetUrl(serviceName, baseUrl, path, context.Request.QueryString.Value);
        attemptedUrls.Add(targetUrl);

        try
        {
            using var upstreamRequest = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUrl);
            foreach (var header in context.Request.Headers)
            {
                if (header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) ||
                    header.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase))
                    continue;

                if (!upstreamRequest.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
                {
                    upstreamRequest.Content ??= new StreamContent(context.Request.Body);
                    upstreamRequest.Content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                }
            }

            if (context.Request.ContentLength is > 0)
            {
                upstreamRequest.Content = new StreamContent(context.Request.Body);
                if (!string.IsNullOrWhiteSpace(context.Request.ContentType))
                    upstreamRequest.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(context.Request.ContentType);
            }

            using var upstreamResponse = await client.SendAsync(upstreamRequest, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);
            var body = await upstreamResponse.Content.ReadAsByteArrayAsync(context.RequestAborted);
            var response = new UpstreamResult(body, upstreamResponse.Content.Headers.ContentType?.ToString(), (int)upstreamResponse.StatusCode);

            foreach (var header in upstreamResponse.Headers)
            {
                if (!IsBlockedResponseHeader(header.Key))
                    context.Response.Headers[header.Key] = header.Value.ToArray();
            }
            foreach (var header in upstreamResponse.Content.Headers)
            {
                if (!IsBlockedResponseHeader(header.Key))
                    context.Response.Headers[header.Key] = header.Value.ToArray();
            }

            return response;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            lastError = ex;
        }
    }

    return Results.Json(new
    {
        error = true,
        message = $"Unable to reach {serviceName} service",
        attempted_urls = attemptedUrls,
        details = lastError?.Message
    }, statusCode: 502);
}

string[] GetServiceUrls(string serviceName)
{
    var configured = serviceMap[serviceName]
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    return configured.Concat(fallbackMap[serviceName]).Distinct().ToArray();
}

string BuildTargetUrl(string serviceName, string baseUrl, string path, string? queryString)
{
    var prefix = prefixMap[serviceName].Trim('/');
    var normalizedPath = path.Trim('/');

    if (!string.IsNullOrWhiteSpace(prefix) && normalizedPath == prefix)
        normalizedPath = "";
    else if (!string.IsNullOrWhiteSpace(prefix) && normalizedPath.StartsWith(prefix + "/", StringComparison.OrdinalIgnoreCase))
        normalizedPath = normalizedPath[(prefix.Length + 1)..];

    var parts = new List<string> { baseUrl.TrimEnd('/') };
    if (!string.IsNullOrWhiteSpace(prefix))
        parts.Add(prefix);
    if (!string.IsNullOrWhiteSpace(normalizedPath))
        parts.Add(normalizedPath);

    return string.Join("/", parts) + queryString;
}

static string[] SupportedMethods() => ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

static bool IsBlockedResponseHeader(string header) =>
    header.Equals("content-encoding", StringComparison.OrdinalIgnoreCase) ||
    header.Equals("content-length", StringComparison.OrdinalIgnoreCase) ||
    header.Equals("transfer-encoding", StringComparison.OrdinalIgnoreCase) ||
    header.Equals("connection", StringComparison.OrdinalIgnoreCase);

sealed class UpstreamResult(byte[] body, string? contentType, int statusCode) : IResult
{
    public async Task ExecuteAsync(HttpContext httpContext)
    {
        httpContext.Response.StatusCode = statusCode;
        if (!string.IsNullOrWhiteSpace(contentType))
            httpContext.Response.ContentType = contentType;
        await httpContext.Response.Body.WriteAsync(body);
    }
}
