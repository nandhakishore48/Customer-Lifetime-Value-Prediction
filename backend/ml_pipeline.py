import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import lightgbm as lgb
import shap
import joblib
import datetime as dt
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LTVPipeline:
    def __init__(self):
        self.clf_model = None
        self.reg_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.features = ['Recency', 'Frequency', 'Monetary', 'Tenure', 'AvgOrderValue', 'PurchaseVelocity']
        
    def engineer_features(self, df):
        """Advanced feature engineering for transaction data."""
        df['TransactionDate'] = pd.to_datetime(df['TransactionDate'])
        today = df['TransactionDate'].max() + dt.timedelta(days=1)
        
        # Aggregating base RFM
        rfm = df.groupby('CustomerID').agg({
            'TransactionDate': [
                lambda x: (today - x.max()).days, # Recency
                lambda x: (today - x.min()).days, # Tenure
                'count' # Frequency
            ],
            'Amount': 'sum' # Monetary
        })
        
        rfm.columns = ['Recency', 'Tenure', 'Frequency', 'Monetary']
        
        # New Features
        rfm['AvgOrderValue'] = rfm['Monetary'] / rfm['Frequency']
        rfm['PurchaseVelocity'] = rfm['Frequency'] / (rfm['Tenure'] + 1)
        
        # Target for Classification: Segments
        # Use qcut for robust segmentation
        rfm['CLV_Score'] = (0.4 * rfm['Frequency']) + (0.4 * (rfm['Monetary'] / 100)) + (0.2 * (100 / (rfm['Recency'] + 1)))
        rfm['Segment'] = pd.qcut(rfm['CLV_Score'], q=3, labels=['Low', 'Medium', 'High'], duplicates='drop')
        
        # Target for Regression: Future Value (Mocked for demo as a function of current value + noise)
        rfm['PredictedValue'] = rfm['Monetary'] * np.random.uniform(1.1, 1.5, size=len(rfm))
        
        return rfm.reset_index()

    def train(self, rfm_df):
        """Trains both classification and regression models with automated comparison."""
        X = rfm_df[self.features]
        y_clf = rfm_df['Segment'].map({'Low': 0, 'Medium': 1, 'High': 2})
        y_reg = rfm_df['PredictedValue']
        
        X_train, X_test, y_clf_train, y_clf_test = train_test_split(X, y_clf, test_size=0.2, random_state=42)
        _, _, y_reg_train, y_reg_test = train_test_split(X, y_reg, test_size=0.2, random_state=42)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # 1. Classification (XGBoost)
        logger.info("Training XGBoost Classifier...")
        self.clf_model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
        self.clf_model.fit(X_train_scaled, y_clf_train)
        clf_acc = accuracy_score(y_clf_test, self.clf_model.predict(X_test_scaled))
        
        # 2. Regression (LightGBM)
        logger.info("Training LightGBM Regressor...")
        self.reg_model = lgb.LGBMRegressor(n_estimators=100, learning_rate=0.05, random_state=42)
        self.reg_model.fit(X_train_scaled, y_reg_train)
        y_reg_pred = self.reg_model.predict(X_test_scaled)
        reg_r2 = r2_score(y_reg_test, y_reg_pred)
        
        # 3. Clustering (KMeans)
        logger.info("Running Behavioral Clustering...")
        kmeans = KMeans(n_clusters=4, random_state=42)
        rfm_df['Cluster'] = kmeans.fit_predict(self.scaler.fit_transform(X))
        
        self.is_trained = True
        
        # Save models
        joblib.dump(self.clf_model, 'backend/instance/clf_model.joblib')
        joblib.dump(self.reg_model, 'backend/instance/reg_model.joblib')
        
        return {
            "clf_accuracy": clf_acc,
            "reg_r2": reg_r2,
            "clusters": 4
        }

    def predict_single(self, input_data):
        """Provides real-time prediction and explainability."""
        if not self.is_trained:
            return {"error": "Models not trained"}
        
        # Prepare input
        # input_data should be a dict with Recency, Frequency, Monetary, etc.
        # If tenure is missing, we estimate it.
        df_input = pd.DataFrame([input_data])
        
        # Ensure all features exist
        for f in self.features:
            if f not in df_input.columns:
                df_input[f] = 0 # Default fallback
                
        X_input = df_input[self.features]
        
        segment_idx = self.clf_model.predict(X_input)[0]
        predicted_value = float(self.reg_model.predict(X_input)[0])
        
        segments = {0: 'Low', 1: 'Medium', 2: 'High'}
        
        # SHAP Explainability (Simple version for demo)
        explainer = shap.TreeExplainer(self.clf_model)
        shap_values = explainer.shap_values(X_input)
        
        # Get top contributing features
        # For multi-class, shap_values is a list. We use the index of the predicted segment.
        contrib = dict(zip(self.features, [float(x) for x in shap_values[segment_idx][0]]))
        insights = sorted(contrib.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        
        recommendations = self.generate_recommendation(segments[segment_idx], predicted_value)
        
        return {
            "segment": segments[segment_idx],
            "predicted_value": round(predicted_value, 2),
            "top_insights": insights,
            "recommendations": recommendations
        }

    def generate_recommendation(self, segment, value):
        """Suggests marketing actions based on segment and value."""
        if segment == 'High':
            return "VIP Treatment: Invite to exclusive loyalty program and offer early access to new products."
        elif segment == 'Medium':
            return "Retention Focus: Send personalized bundles and periodic discount codes to increase frequency."
        else:
            return "Re-engagement: Trigger 'we miss you' emails with significant win-back discounts."

    def calculate_churn_prob(self, rfm_df):
        """Calculates simple churn probability based on recency vs frequency."""
        # High recency relative to tenure/frequency indicates churn risk
        rfm_df['ChurnProbability'] = (rfm_df['Recency'] / (rfm_df['Tenure'] + 1)).clip(0, 1)
        return rfm_df

if __name__ == "__main__":
    # Test pipeline
    from ml_engine import CLEngine
    mock_data = CLEngine().generate_sample_data(500)
    pipeline = LTVPipeline()
    processed = pipeline.engineer_features(mock_data)
    results = pipeline.train(processed)
    print(f"Training Results: {results}")
    
    single = pipeline.predict_single({
        "Recency": 10, "Frequency": 5, "Monetary": 1000, 
        "Tenure": 365, "AvgOrderValue": 200, "PurchaseVelocity": 0.01
    })
    print(f"Single Prediction: {single}")
