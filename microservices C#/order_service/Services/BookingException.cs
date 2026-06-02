namespace OrderService.Services;

public sealed class BookingException(string message, int statusCode = 400) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

