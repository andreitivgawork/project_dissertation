from flask import Blueprint, jsonify

main = Blueprint('main', __name__)

@main.route('/api/info', methods=['GET'])
def get_info():
    return jsonify({"message": "Hello from the backend!"})