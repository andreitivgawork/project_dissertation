from flask import Blueprint, jsonify, request
from .models import User, db

main = Blueprint('main', __name__)

@main.route('/api/info', methods=['GET'])
def get_info():
    return jsonify({"message": "Hello from the backend!"})

@main.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    users_list = [{"id": user.id, "name": user.name, "email": user.email} for user in users]
    return jsonify(users_list)

@main.route('/api/add_user', methods=['POST'])
def add_user():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    new_user = User(name=name, email=email)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User added!"}), 201