from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from ml_pipeline import LTVPipeline
import pandas as pd
import io
import jwt
import datetime
import os
import logging
from functools import wraps

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'clv-ai-enterprise-secret-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///enterprise_ltv.db')
if app.config['SQLALCHEMY_DATABASE_URI'].startswith("postgres://"):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
pipeline = LTVPipeline()

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class AnalysisResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    customer_count = db.Column(db.Integer)
    avg_clv = db.Column(db.Float)
    accuracy = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

with app.app_context():
    db.create_all()

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
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# API Routes
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "online", "engine": "Enterprise LTV v2.0"})

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 400
    
    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(email=data['email'], password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({'token': token, 'user': {'email': user.email, 'is_admin': user.is_admin}})

@app.route('/api/upload', methods=['POST'])
@token_required
def upload_csv(current_user):
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    try:
        df = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
        logger.info(f"Processing CSV with {len(df)} rows for user {current_user.email}")
        
        # ML Processing
        processed_rfm = pipeline.engineer_features(df)
        stats = pipeline.train(processed_rfm)
        
        # Save to DB
        result = AnalysisResult(
            user_id=current_user.id,
            customer_count=len(processed_rfm),
            avg_clv=float(processed_rfm['PredictedValue'].mean()),
            accuracy=stats['clf_accuracy']
        )
        db.session.add(result)
        db.session.commit()
        
        # Return summary + sample data
        return jsonify({
            "message": "Analysis complete",
            "stats": stats,
            "summary": {
                "total_customers": len(processed_rfm),
                "avg_clv": round(processed_rfm['PredictedValue'].mean(), 2),
                "high_value_count": len(processed_rfm[processed_rfm['Segment'] == 'High']),
                "segment_counts": processed_rfm['Segment'].value_counts().to_dict()
            },
            "data": processed_rfm.to_dict(orient='records')[:100]
        })
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['POST'])
@token_required
def predict_single(current_user):
    data = request.json
    try:
        prediction = pipeline.predict_single(data)
        return jsonify(prediction)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/export', methods=['GET'])
@token_required
def export_results(current_user):
    # For demo, we regenerate some data if not available
    # In production, this would fetch from a cached results table
    from ml_engine import CLEngine
    mock_df = CLEngine().generate_sample_data(100)
    processed = pipeline.engineer_features(mock_df)
    
    output = io.BytesIO()
    processed.to_csv(output, index=False)
    output.seek(0)
    
    return send_file(
        output,
        mimetype="text/csv",
        as_attachment=True,
        download_name="clv_predictions.csv"
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
