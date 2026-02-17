from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import os

# --- NEW IMPORTS FOR SMART SEMANTIC MATCHING ---
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)

# Load the NLP model once when the server starts
print("Loading Sentence Transformer model...")
nlp_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully!")

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
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(email=data['email']).first()
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid', 'error': str(e)}), 401

        return f(current_user, *args, **kwargs)

    return decorated

# --- NEW HELPER: SEMANTIC NLP MATCHING ---
def compute_nlp_similarity(text1, text2):
    """
    Uses Sentence Transformers to compare the semantic meaning of two strings.
    Returns a score between 0.0 and 100.0
    """
    if not text1 or not text2:
        return 0.0
    
    try:
        # Convert texts to dense semantic vectors
        embeddings1 = nlp_model.encode(text1, convert_to_tensor=True)
        embeddings2 = nlp_model.encode(text2, convert_to_tensor=True)
        
        # Calculate cosine similarity of the dense vectors
        cosine_scores = util.cos_sim(embeddings1, embeddings2)
        
        # Extract the value from the tensor object
        similarity = cosine_scores[0][0].item()
        
        # Force Python float and ensure it doesn't dip below 0
        return float(round(max(similarity, 0) * 100, 1))
    except Exception as e:
        print(f"Error in semantic matching: {e}")
        return 0.0

# ============================================================================
# SMART RANKING ALGORITHM
# ============================================================================
@app.route('/api/rank_jobs', methods=['POST'])
@token_required
def rank_jobs(current_user):
    data = request.get_json()
    analyses = data.get('analyses', [])

    if not analyses:
        return jsonify([]), 200

    user_profession = (current_user.profession or "Student").lower().strip()
    processed_results = []

    for item in analyses:
        try:
            job_description = item.get('jobDescription', "")
            resume_text = item.get('resumeText', "")

            # --- A. Extract Real Value Score ---
            confidence_data = item.get('confidence', {})
            base_real_score = 0.0
            if isinstance(confidence_data, dict):
                conf_list = confidence_data.get('confidences', [])
                real_data = next((c for c in conf_list if c['label'].upper() == 'REAL'), None)
                base_real_score = (real_data['confidence'] * 100) if real_data else 0.0

            # --- B. Safety Check ---
            is_safe = base_real_score >= 50
            risk_level = "LOW" if is_safe else "HIGH"

            # --- C. NLP Relevance Score (Profession vs Job Description) ---
            profession_match_score = compute_nlp_similarity(user_profession, job_description)
            # FORCE Python bool to prevent JSON serialization errors
            is_relevant = bool(profession_match_score > 10.0) 

            # --- D. Apply Scoring Logic ---
            personalized_score = base_real_score
            alert = None

            if is_relevant:
                personalized_score = min(base_real_score * 1.2, 100.0)
            else:
                if base_real_score > 60:
                    personalized_score = base_real_score * 0.6
                    alert = f"Authentic job, but might not align with a {user_profession} role."

            if not is_safe:
                alert = "CRITICAL: Potential Fake Job detected."

            # --- E. TRUE CV Match Score (Resume vs Job Description) ---
            cv_match_score = None
            composite_score = personalized_score

            if is_safe and resume_text:
                cv_match_score = compute_nlp_similarity(resume_text, job_description)
                # Composite = 60% authenticity + 40% CV match
                composite_score = (0.60 * personalized_score) + (0.40 * cv_match_score)

            processed_results.append({
                **item,
                "base_real_score": round(base_real_score, 1),
                "personalized_score": round(personalized_score, 1),
                "composite_score": round(composite_score, 1),
                "cvMatchScore": cv_match_score,
                "is_relevant": is_relevant,
                "is_safe": is_safe,
                "relevance_alert": alert,
                "risk_level": risk_level,
                "user_profession": current_user.profession
            })

        except Exception as e:
            print(f"Skipping error item: {e}")
            continue

    # --- F. Sorting Strategy ---
    processed_results.sort(
        key=lambda x: (x['is_safe'], x['composite_score']),
        reverse=True
    )

    return jsonify(processed_results), 200

# ============================================================================
# AUTH ROUTES
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