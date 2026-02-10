from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db = SQLAlchemy(app)

# User Model


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    profession = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return f'<User {self.email}>'


# Create database tables
with app.app_context():
    db.create_all()

    # Add default users if database is empty
    if User.query.count() == 0:
        default_users = [
            User(
                name='Admin User',
                email='admin@example.com',
                password=generate_password_hash('password123'),
                profession='Administrator'
            ),
            User(
                name='Regular User',
                email='user@example.com',
                password=generate_password_hash('user123'),
                profession='Developer'
            )
        ]
        db.session.add_all(default_users)
        db.session.commit()
        print("✅ Default users created!")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(
                token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(email=data['email']).first()
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Name, email, and password are required'}), 400

    name = data.get('name')
    email = data.get('email').lower().strip()
    password = data.get('password')
    profession = data.get('profession', '').strip()  # Optional field

    # Validate email format
    if '@' not in email or '.' not in email:
        return jsonify({'message': 'Invalid email format'}), 400

    # Validate password length
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters long'}), 400

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'Email already registered'}), 409

    # Create new user
    try:
        new_user = User(
            name=name,
            email=email,
            password=generate_password_hash(password),
            profession=profession if profession else None
        )
        db.session.add(new_user)
        db.session.commit()

        # Create token for automatic login
        token = jwt.encode({
            'email': email,
            'name': name,
            'user_id': new_user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': 'Account created successfully',
            'token': token,
            'user': {
                'id': new_user.id,
                'email': email,
                'name': name,
                'profession': profession,
                'created_at': new_user.created_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'An error occurred during signup'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400

    email = data.get('email').lower().strip()
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        token = jwt.encode({
            'email': email,
            'name': user.name,
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': email,
                'name': user.name,
                'profession': user.profession,
                'created_at': user.created_at.isoformat()
            }
        }), 200

    return jsonify({'message': 'Invalid email or password'}), 401


@app.route('/api/verify', methods=['GET'])
@token_required
def verify(current_user):
    return jsonify({
        'message': 'Token is valid',
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'name': current_user.name,
            'profession': current_user.profession
        }
    }), 200


@app.route('/api/user', methods=['GET'])
@token_required
def get_user(current_user):
    return jsonify({
        'user': {
            'id': current_user.id,
            'name': current_user.name,
            'email': current_user.email,
            'profession': current_user.profession,
            'created_at': current_user.created_at.isoformat()
        }
    }), 200


@app.route('/api/user', methods=['PUT'])
@token_required
def update_user(current_user):
    data = request.get_json()

    if data.get('name'):
        current_user.name = data.get('name')

    if data.get('profession') is not None:
        current_user.profession = data.get('profession')

    try:
        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': current_user.id,
                'name': current_user.name,
                'email': current_user.email,
                'profession': current_user.profession
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'An error occurred during update'}), 500


@app.route('/api/protected', methods=['GET'])
@token_required
def protected(current_user):
    return jsonify({
        'message': 'This is a protected route',
        'data': 'Secret data',
        'user': current_user.name
    }), 200


@app.route('/api/users/count', methods=['GET'])
def get_user_count():
    count = User.query.count()
    return jsonify({'count': count}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
