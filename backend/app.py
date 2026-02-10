from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import os

app = Flask(__name__)

# --- Configuration ---
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db = SQLAlchemy(app)

# --- User Model ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    profession = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return f'<User {self.email}>'

# --- Database Initialization ---
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

# --- Helper: Token Decorator ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Using HS256 algorithm explicitly
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(email=data['email']).first()
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid', 'error': str(e)}), 401

        return f(current_user, *args, **kwargs)

    return decorated

# ============================================================================
# SMART RANKING ALGORITHM (Merged from New Code)
# ============================================================================
@app.route('/api/rank_jobs', methods=['POST'])
@token_required
def rank_jobs(current_user):
    data = request.get_json()
    analyses = data.get('analyses', [])
    
    if not analyses:
        return jsonify([]), 200
    
    # 1. Determine User Profession
    user_profession = (current_user.profession or "Student").lower().strip()
    profession_keywords = set(user_profession.split())
    
    processed_results = []
    
    for item in analyses:
        try:
            # --- A. Extract Real Value Score ---
            confidence_data = item.get('confidence', {})
            # Handle case where confidence is a string or object
            if isinstance(confidence_data, str):
                 # Skip simple string confidences or handle differently
                 continue
                 
            conf_list = confidence_data.get('confidences', [])
            
            # Find the score for "REAL" label
            real_data = next((c for c in conf_list if c['label'].upper() == 'REAL'), None)
            base_real_score = (real_data['confidence'] * 100) if real_data else 0.0
            
            # --- B. Check Professional Relevance ---
            job_description = item.get('jobDescription', "").lower()
            is_relevant = False
            
            # Keyword matching logic
            if 'developer' in user_profession or 'engineer' in user_profession:
                dev_keywords = ['software', 'developer', 'engineer', 'react', 'node', 'python', 'java', 'web', 'coding']
                is_relevant = any(kw in job_description for kw in dev_keywords)
            elif 'student' in user_profession:
                student_keywords = ['intern', 'internship', 'fresher', 'graduate', 'entry level', 'student']
                is_relevant = any(kw in job_description for kw in student_keywords)
            else:
                is_relevant = any(kw in job_description for kw in profession_keywords if len(kw) > 3)

            # --- C. Safety Check ---
            # Any job with Real Score < 50 is considered Unsafe/Fake
            is_safe = base_real_score >= 50
            risk_level = "LOW" if is_safe else "HIGH"

            # --- D. Apply Scoring Logic & Multipliers ---
            personalized_score = base_real_score
            alert = None

            if is_relevant:
                # MATCH: Boost score (1.2x)
                personalized_score = min(base_real_score * 1.2, 100.0)
            else:
                # MISMATCH
                if base_real_score > 60:
                    # Logic: If Real > 60% (but irrelevant), penalize to push down (0.6x)
                    personalized_score = base_real_score * 0.6
                    alert = f"Authentic job, but not relevant to {current_user.profession}."
                else:
                    # Logic: If Real < 60%, it's already low, keep as is
                    personalized_score = base_real_score

            # Add specific alert for Fake jobs regardless of relevance
            if not is_safe:
                alert = "CRITICAL: Potential Fake Job detected."

            processed_results.append({
                **item,
                "base_real_score": round(base_real_score, 1),
                "personalized_score": round(personalized_score, 1),
                "is_relevant": is_relevant,
                "is_safe": is_safe,
                "relevance_alert": alert,
                "risk_level": risk_level,
                "user_profession": current_user.profession
            })
            
        except Exception as e:
            print(f"Skipping error item: {e}")
            continue

    # --- E. Sorting Strategy ---
    # Priority 1: Safety (Safe jobs appear first)
    # Priority 2: Relevance (Relevant jobs appear next)
    # Priority 3: Score (Highest score within the category)
    processed_results.sort(
        key=lambda x: (x['is_safe'], x['is_relevant'], x['personalized_score']), 
        reverse=True
    )
    
    return jsonify(processed_results), 200

# ============================================================================
# AUTH ROUTES (Merged from Old Code)
# ============================================================================

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Name, email, and password are required'}), 400

    name = data.get('name')
    email = data.get('email').lower().strip()
    password = data.get('password')
    profession = data.get('profession', '').strip()

    if '@' not in email or '.' not in email:
        return jsonify({'message': 'Invalid email format'}), 400

    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters long'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'Email already registered'}), 409

    try:
        new_user = User(
            name=name,
            email=email,
            password=generate_password_hash(password),
            profession=profession if profession else None
        )
        db.session.add(new_user)
        db.session.commit()

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