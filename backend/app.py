from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import datetime
from functools import wraps
import json
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
CORS(app)

# File to store users (simple JSON file - no database needed)
USERS_FILE = 'users.json'

def load_users():
    """Load users from JSON file"""
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    """Save users to JSON file"""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

# Initialize with default users if file doesn't exist
if not os.path.exists(USERS_FILE):
    default_users = {
        'admin@example.com': {
            'password': generate_password_hash('password123'),
            'name': 'Admin User'
        },
        'user@example.com': {
            'password': generate_password_hash('user123'),
            'name': 'Regular User'
        }
    }
    save_users(default_users)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    users = load_users()
    
    if email in users and check_password_hash(users[email]['password'], password):
        token = jwt.encode({
            'email': email,
            'name': users[email]['name'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'email': email,
                'name': users[email]['name']
            }
        }), 200
    
    return jsonify({'message': 'Invalid email or password'}), 401

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Email, password, and name are required'}), 400
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    # Validate email format
    if '@' not in email or '.' not in email:
        return jsonify({'message': 'Invalid email format'}), 400
    
    # Validate password length
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters long'}), 400
    
    users = load_users()
    
    # Check if user already exists
    if email in users:
        return jsonify({'message': 'Email already registered'}), 409
    
    # Hash the password and save user
    users[email] = {
        'password': generate_password_hash(password),
        'name': name
    }
    save_users(users)
    
    # Create token for automatic login after signup
    token = jwt.encode({
        'email': email,
        'name': name,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'Account created successfully',
        'token': token,
        'user': {
            'email': email,
            'name': name
        }
    }), 201

@app.route('/api/verify', methods=['GET'])
@token_required
def verify():
    return jsonify({'message': 'Token is valid'}), 200

@app.route('/api/protected', methods=['GET'])
@token_required
def protected():
    return jsonify({'message': 'This is a protected route', 'data': 'Secret data'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)