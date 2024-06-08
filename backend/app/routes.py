from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import requests
import os
from .models import User, Account, db
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import re

ckpt = 'meyandrei/bankchat'
tokenizer = AutoTokenizer.from_pretrained(ckpt, padding_side='left', use_safetensors=True)
model = AutoModelForCausalLM.from_pretrained(ckpt, use_safetensors=True)
context_token = tokenizer.encode('<|context|>', return_tensors='pt')
endofcontext_token = tokenizer.encode(' <|endofcontext|>', return_tensors='pt')

main = Blueprint('main', __name__)

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
    response, status = get_account_balance(user_id, account_type)
    return jsonify(response), status
    
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

@main.route('/api/transfer_money', methods=['POST'])
@jwt_required()
def transfer_money():
    data = request.get_json()
    sender_id = get_jwt_identity()
    recipient_email = data.get('recipient_email')
    amount = data.get('amount')
    source_account_type = data.get('source_account_type')
    destination_account_type = data.get('destination_account_type')

    response, status = perform_transfer(sender_id, recipient_email, amount, source_account_type, destination_account_type)
    return jsonify(response), status

@main.route('/api/chat', methods=['POST'])
@jwt_required()
def chat():
    data = request.get_json()
    user_id = get_jwt_identity()

    user_input = data.get('user_input')
    history = data.get('history')

    history, beliefs, actions, system_response = generate_chat_response(user_input, history)

    # for replacing delexicalized values in system response
    if 'confirm' or 'request' in actions:
        slot_value = {}
        if ',' in beliefs:
            bel = [s.strip() for s in beliefs.split(',')]
        else:
            bel = [beliefs.strip()]

        if bel[0] != '':
            for b in bel:
                slot = b.split()[1]
                value = b.split()[2]
                slot_value[slot] = value

            system_response = replace_placeholders(system_response, slot_value)
        

    # check account balance
    if 'offer' in actions:
        # extract the beliefs - will have a list of the beliefs
        if ',' in beliefs:
            bel = [s.strip() for s in beliefs.split(',')]
        else:
            bel = [beliefs.strip()]

        for b in bel:
            value = b.split()[2] #checking or savings

        get_balance_response = get_account_balance(user_id, value)
        balance = get_balance_response[0][value]

        if get_balance_response[1] == 200:
            history = []
            beliefs = ''
            actions = ''

            if '[banks_balance]' in system_response:
                system_response = system_response.replace('[banks_balance]', str(balance))

        elif get_balance_response[1] == 400 or get_balance_response[1] == 404:
            return jsonify(
                {
                    "history": [],
                    "beliefs": '',
                    "actions": '',
                    "system_response": 'The transfer could not be done. Please try again. Reason: ' + transfer_response[0]['message']
                }
            )


    # transfer
    if 'notify_success' in actions:
        transfer_slot_values_map = {
            'recipient_account_name': '',
            'account_type': '',
            'recipient_account_type': '',
            'amount': '',
        }

        # extract the beliefs - will have a list of the beliefs
        if ',' in beliefs:
            bel = [s.strip() for s in beliefs.split(',')]
        else:
            bel = [beliefs.strip()]
        
        for b in bel:
            slot = b.split()[1]
            value = b.split()[2]

            # edge case clean the slot of special characters account_type[
            pattern = r'^[^\w]+|[^\w]+$'
            slot = re.sub(pattern, '', slot)

            if (value == '$'): # edge case banks amount $ 200
                value = b.split()[3]

            transfer_slot_values_map[slot] = value

        print(beliefs)
        print(actions)
        print(system_response)
        print(transfer_slot_values_map)


        if transfer_slot_values_map['recipient_account_name'] == '' or transfer_slot_values_map['account_type'] == '' or transfer_slot_values_map['amount'] == '':
            return jsonify(
                {
                    "history": [],
                    "beliefs": '',
                    "actions": '',
                    "system_response": 'The transfer could not be done. Please try again. Reason: We are missing some information.'
                }
            )
        
        if transfer_slot_values_map['recipient_account_type'] == '':
            transfer_slot_values_map['recipient_account_type'] = transfer_slot_values_map['account_type']

        transfer_response = perform_transfer(user_id, 
                         transfer_slot_values_map['recipient_account_name'],
                         transfer_slot_values_map['amount'],
                         transfer_slot_values_map['account_type'],
                         transfer_slot_values_map['recipient_account_type'])

        if transfer_response[1] == 200:
            history = []
            beliefs = ''
            actions = ''

        elif transfer_response[1] == 400 or transfer_response[1] == 404:
            return jsonify(
                {
                    "history": [],
                    "beliefs": '',
                    "actions": '',
                    "system_response": 'The transfer could not be done. Please try again. Reason: ' + transfer_response[0]['message']
                }
            )

    return jsonify(
        {
            "history": history,
            "beliefs": beliefs,
            "actions": actions,
            "system_response": system_response
        }
    )

def replace_placeholders(text, replacement_dict):
    pattern = r'\[banks_(.*?)\]'

    def replace_match(match):
        key = match.group(1)
        return replacement_dict.get(key, match.group(0))

    return re.sub(pattern, replace_match, text)
        
def get_account_balance(user_id, account_type=None):
    if account_type:
        if account_type not in ['checking', 'savings']:
            return {"message": "Invalid account type"}, 400
        account = Account.query.filter_by(user_id=user_id, type=account_type).first()
        if account:
            return {account.type: account.balance}, 200
        else:
            return {"message": "Account not found"}, 404
    else:
        accounts = Account.query.filter_by(user_id=user_id).all()
        account_balances = {account.type: account.balance for account in accounts}
        return account_balances, 200
    
def perform_transfer(sender_id, recipient_email, amount, source_account_type, destination_account_type):
    amount = float(str(amount).lstrip("$"))

    if not amount or amount <= 0:
        return {"message": "Invalid amount"}, 400

    recipient = User.query.filter_by(name=recipient_email).first()
    if not recipient:
        return {"message": "Recipient not found"}, 404

    source_account = Account.query.filter_by(user_id=sender_id, type=source_account_type).first()
    destination_account = Account.query.filter_by(user_id=recipient.id, type=destination_account_type).first()

    if not source_account or source_account.balance < amount:
        return {"message": "Insufficient funds"}, 400

    if not destination_account:
        return {"message": "Destination account not found"}, 404

    # Perform the transfer
    source_account.balance -= amount
    destination_account.balance += amount
    db.session.commit()

    return {"message": "Transfer successful"}, 200

def generate_chat_response(input, history):
    if history == []:
        context_tokenized = torch.LongTensor(history)
    else:
        history_str = tokenizer.decode(history[0])
        turns = re.split('<\|system\|>|<\|user\|>', history_str)[1:]

        for i in range(0, len(turns)-1, 2):
            turns[i] = '<|user|>' + turns[i]
            turns[i+1] = '<|system|>' + turns[i+1]

        context_tokenized = tokenizer.encode(''.join(turns), return_tensors='pt') 

    user_input_tokenized = tokenizer.encode(' <|user|> '+ input, return_tensors='pt')

    model_input = torch.cat([context_token, context_tokenized, user_input_tokenized, endofcontext_token], dim=-1)
    attention_mask = torch.ones_like(model_input)

    out_tokenized = model.generate(model_input, max_length=1024, eos_token_id=50258, pad_token_id=50260, attention_mask=attention_mask).tolist()[0]
    out_str = tokenizer.decode(out_tokenized)
    out_str = out_str.split('\n')[0]

    generated_substring = out_str.split('<|endofcontext|>')[1] #belief, actions, system_response

    beliefs_start_index = generated_substring.find('<|belief|>') + len('<|belief|>')
    beliefs_end_index = generated_substring.find('<|endofbelief|>', beliefs_start_index)

    actions_start_index = generated_substring.find('<|action|>') + len('<|action|>')
    actions_end_index = generated_substring.find('<|endofaction|>', actions_start_index)

    response_start_index = generated_substring.find('<|response|>') + len('<|response|>')
    response_end_index = generated_substring.find('<|endofresponse|>', response_start_index)

    beliefs_str = generated_substring[beliefs_start_index:beliefs_end_index]
    actions_str = generated_substring[actions_start_index:actions_end_index]
    system_response_str = generated_substring[response_start_index:response_end_index]

    system_resp_tokenized = tokenizer.encode(' <|system|> '+ system_response_str, return_tensors='pt')
    history = torch.cat([torch.LongTensor(history), user_input_tokenized, system_resp_tokenized], dim=-1).tolist()

    return history, beliefs_str, actions_str, system_response_str    