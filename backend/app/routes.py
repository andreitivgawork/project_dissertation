from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .models import User, Account, db

main = Blueprint('main', __name__)

@main.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    print("Fetching users")
    users = User.query.all()
    users_list = [{"id": user.id, "name": user.name, "email": user.email} for user in users]
    return jsonify(users_list)

@main.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400
    new_user = User(name=name, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    # Create two accounts: checking and savings
    checking_account = Account(type='checking', balance=0.0, user_id=new_user.id)
    savings_account = Account(type='savings', balance=0.0, user_id=new_user.id)
    db.session.add(checking_account)
    db.session.add(savings_account)
    db.session.commit()
    return jsonify({"message": "User registered!"}), 201

@main.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if user is None or not user.check_password(password):
        return jsonify({"message": "Invalid credentials"}), 401
    access_token = create_access_token(identity=user.id)
    return jsonify({"message": "Logged in successfully", "access_token": access_token})

@main.route('/api/account_balance', methods=['GET'])
@jwt_required()
def account_balance():
    user_id = get_jwt_identity()
    account_type = request.args.get('type')

    if account_type:
        if account_type not in ['checking', 'savings']:
            return jsonify({"message": "Invalid account type"}), 400
        account = Account.query.filter_by(user_id=user_id, type=account_type).first()
        if account:
            return jsonify({account.type: account.balance})
        else:
            return jsonify({"message": "Account not found"}), 404
    else:
        accounts = Account.query.filter_by(user_id=user_id).all()
        account_balances = {account.type: account.balance for account in accounts}
        return jsonify(account_balances)

@main.route('/api/transfer_money', methods=['POST'])
@jwt_required()
def transfer_money():
    data = request.get_json()
    sender_id = get_jwt_identity()
    recipient_email = data.get('recipient_email')
    amount = data.get('amount')
    source_account_type = data.get('source_account_type')
    destination_account_type = data.get('destination_account_type')

    if not amount or amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400

    recipient = User.query.filter_by(email=recipient_email).first()
    if not recipient:
        return jsonify({"message": "Recipient not found"}), 404

    source_account = Account.query.filter_by(user_id=sender_id, type=source_account_type).first()
    destination_account = Account.query.filter_by(user_id=recipient.id, type=destination_account_type).first()

    if not source_account or source_account.balance < amount:
        return jsonify({"message": "Insufficient funds"}), 400

    if not destination_account:
        return jsonify({"message": "Destination account not found"}), 404

    # Perform the transfer
    source_account.balance -= amount
    destination_account.balance += amount
    db.session.commit()

    return jsonify({"message": "Transfer successful"})

@main.route('/api/add_money', methods=['POST'])
@jwt_required()
def add_money():
    data = request.get_json()
    user_id = get_jwt_identity()
    amount = data.get('amount')
    account_type = data.get('account_type')

    if not amount or amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400

    account = Account.query.filter_by(user_id=user_id, type=account_type).first()

    if not account:
        return jsonify({"message": "Account not found"}), 404

    # Add money to the account
    account.balance += amount
    db.session.commit()

    return jsonify({"message": "Money added successfully"})

@main.route('/api/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logged out successfully"})
    return response
