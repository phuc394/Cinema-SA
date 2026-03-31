from flask import jsonify

from pyms.flask.app import Microservice

ms = Microservice() # 1.1
app = ms.create_app() # 2.1


@app.route("/") # 3.1
def example():
    return jsonify({"main": "hello world"})


if __name__ == '__main__':
    app.run()