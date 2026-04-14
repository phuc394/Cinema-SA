FROM python:3.14.3-alpine3.21

RUN apk add --update curl gcc g++ git libffi-dev openssl-dev python3-dev build-base linux-headers \
    && rm -rf /var/cache/apk/*

ENV PYTHONUNBUFFERED=1 ENVIRONMENT=pre APP_HOME=/microservice/
ENV DATABASE_DIR=database
ENV PYMS_CONFIGMAP_FILE="${APP_HOME}config-docker.yml"
RUN mkdir $APP_HOME && adduser -S -D -H python

RUN chown -R python $APP_HOME
WORKDIR $APP_HOME
RUN pip install pipenv
COPY Pipfile* /tmp/
RUN cd /tmp && pipenv lock --requirements > requirements.txt
RUN pip install -r /tmp/requirements.txt
RUN pip install gevent gunicorn
ADD . $APP_HOME

RUN mkdir $DATABASE_DIR
RUN chmod 777 $DATABASE_DIR

EXPOSE 5000
USER python

CMD ["gunicorn", "--workers", "8", "--log-level", "INFO", "--bind", "0.0.0.0:5000", "manage:app"]
