from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from ml_engine import CLEngine
import pandas as pd
import io
import jwt
import datetime
import os
from functools import wraps

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'clv-ai-secret-key-2026'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
engine = CLEngine()

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

with app.app_context():
    db.create_all()
    # Create default admin if not exists
    if not User.query.filter_by(email='admin@ai.com').first():
        hashed_pw = generate_password_hash('admin123', method='pbkdf2:sha256')
        admin = User(email='admin@ai.com', password=hashed_pw, is_admin=True)
        db.session.add(admin)
        db.session.commit()

# Auth Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split(" ")[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Global state for demo
current_rfm_data = None

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(email=data['email'], password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {
            'email': user.email,
            'is_admin': user.is_admin
        }
    })

@app.route('/api/generate-data', methods=['POST'])
@token_required
def generate_data(current_user):
    global current_rfm_data
    raw_df = engine.generate_sample_data()
    processed_df = engine.preprocess_data(raw_df)
    current_rfm_data = engine.calculate_rfm(processed_df)
    accuracy, report = engine.train_model(current_rfm_data)
    
    return jsonify({
        "message": "Data generated successfully",
        "customer_count": len(current_rfm_data),
        "accuracy": accuracy,
        "report": report,
        "data": current_rfm_data.to_dict(orient='records')[:100]
    })

@app.route('/api/process-csv', methods=['POST'])
@token_required
def process_csv(current_user):
    global current_rfm_data
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    df = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
    
    processed_df = engine.preprocess_data(df)
    current_rfm_data = engine.calculate_rfm(processed_df)
    accuracy, report = engine.train_model(current_rfm_data)
    
    return jsonify({
        "customer_count": len(current_rfm_data),
        "accuracy": accuracy,
        "report": report,
        "data": current_rfm_data.to_dict(orient='records')
    })

@app.route('/api/predict', methods=['POST'])
@token_required
def predict(current_user):
    data = request.json
    try:
        segment = engine.predict_segment(
            float(data.get('recency')), 
            float(data.get('frequency')), 
            float(data.get('monetary'))
        )
        return jsonify({"segment": segment})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    if current_rfm_data is None:
        return jsonify({"error": "No data available"}), 404
    
    stats = {
        "total_customers": len(current_rfm_data),
        "avg_recency": float(current_rfm_data['Recency'].mean()),
        "avg_frequency": float(current_rfm_data['Frequency'].mean()),
        "avg_monetary": float(current_rfm_data['Monetary'].mean()),
        "segments": current_rfm_data['Segment'].value_counts().to_dict()
    }
    return jsonify(stats)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
