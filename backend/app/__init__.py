from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Configure the Flask app for SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@db:5432/app_db'  # Use PostgreSQL for the database
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    migrate = Migrate(app, db)
    
    CORS(app)  # Enable CORS for all routes

    from .routes import main
    app.register_blueprint(main)

    return app