import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import datetime as dt

class CLEngine:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False
        self.features = ['Recency', 'Frequency', 'Monetary', 'AvgOrderValue']
        self.target = 'Segment_Label' # 0: Low, 1: Medium, 2: High

    def generate_sample_data(self, n_customers=1000):
        """Generates mock transaction data for demonstration."""
        customer_ids = [f'C{str(i).zfill(4)}' for i in range(1, n_customers + 1)]
        data = []
        
        today = dt.datetime.now()
        
        for cid in customer_ids:
            # Random number of transactions
            freq = np.random.randint(1, 20)
            for _ in range(freq):
                # Random date within the last year
                days_ago = np.random.randint(0, 365)
                date = today - dt.timedelta(days=days_ago)
                # Random amount
                amount = np.random.uniform(10, 500)
                data.append([cid, date.strftime('%Y-%m-%d'), round(amount, 2)])
        
        df = pd.DataFrame(data, columns=['CustomerID', 'TransactionDate', 'Amount'])
        return df

    def preprocess_data(self, df):
        """Preprocesses the transaction data."""
        df['TransactionDate'] = pd.to_datetime(df['TransactionDate'])
        df = df.dropna()
        df = df.sort_values(['CustomerID', 'TransactionDate'])
        return df

    def calculate_rfm(self, df):
        """Calculates RFM metrics."""
        today = df['TransactionDate'].max() + dt.timedelta(days=1)
        
        rfm = df.groupby('CustomerID').agg({
            'TransactionDate': lambda x: (today - x.max()).days,
            'CustomerID': 'count',
            'Amount': 'sum'
        })
        
        rfm.columns = ['Recency', 'Frequency', 'Monetary']
        rfm['AvgOrderValue'] = rfm['Monetary'] / rfm['Frequency']
        
        # CLV Score calculation
        # Recency Score = 100 / (Recency + 1)
        rfm['RecencyScore'] = 100 / (rfm['Recency'] + 1)
        
        # Formula: CLV Score = (0.4 * Frequency) + (0.4 * Monetary) + (0.2 * Recency Score)
        # Note: In real scenarios, monetary is usually scaled. We'll use a simplified version.
        rfm['CLV_Score'] = (0.4 * rfm['Frequency']) + (0.4 * (rfm['Monetary'] / 100)) + (0.2 * rfm['RecencyScore'])
        
        # Segmentation using qcut
        rfm['Segment'] = pd.qcut(rfm['CLV_Score'], q=3, labels=['Low', 'Medium', 'High'])
        
        # Numeric labels for ML
        label_map = {'Low': 0, 'Medium': 1, 'High': 2}
        rfm['Segment_Label'] = rfm['Segment'].map(label_map)
        
        return rfm.reset_index()

    def train_model(self, rfm_df):
        """Trains the Random Forest classifier."""
        X = rfm_df[self.features]
        y = rfm_df[self.target]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High'], output_dict=True)
        
        return accuracy, report

    def predict_segment(self, recency, frequency, monetary):
        """Predicts the segment for a new customer."""
        if not self.is_trained:
            return "Model not trained"
        
        avg_order_value = monetary / frequency if frequency > 0 else 0
        input_data = pd.DataFrame([[recency, frequency, monetary, avg_order_value]], columns=self.features)
        
        prediction = self.model.predict(input_data)[0]
        segments = {0: 'Low', 1: 'Medium', 2: 'High'}
        return segments[prediction]

if __name__ == "__main__":
    # Test the engine
    engine = CLEngine()
    raw_data = engine.generate_sample_data()
    print("Sample data generated.")
    
    clean_data = engine.preprocess_data(raw_data)
    rfm_data = engine.calculate_rfm(clean_data)
    print("RFM calculation complete.")
    
    acc, rep = engine.train_model(rfm_data)
    print(f"Model trained with accuracy: {acc:.2f}")
    
    # Test prediction
    test_pred = engine.predict_segment(10, 5, 1000)
    print(f"Prediction for (R=10, F=5, M=1000): {test_pred}")
