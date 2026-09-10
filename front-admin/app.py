from flask import Flask
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Importa e registra as rotas (Faremos isso no próximo passo)
    from routes.web import web_bp
    app.register_blueprint(web_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)