from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'martin'  # Replace with a secure key
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@db:5432/app_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'jwt-secret-string'  # Change this!

    db.init_app(app)
    migrate = Migrate(app, db)

    # Configure CORS
    CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    # JWT setup
    jwt = JWTManager(app)

    from .routes import main
    app.register_blueprint(main)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0')
