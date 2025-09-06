import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
df = pd.read_csv("lifestyle_diseases_dataset.csv")

# Encode categorical variables (one-hot encoding)
df = pd.get_dummies(df, columns=["Gender", "Smoking", "Alcohol", "Exercise_Freq"], drop_first=True)

# Define numeric features
numeric_features = ["Age", "Height_cm", "Weight_kg", "Sleep_Hours", "Stress_Level",
                    "SystolicBP", "DiastolicBP", "Cholesterol", "BloodSugar", "BMI"]

# Collect one-hot encoded columns
one_hot_features = list(df.columns[df.columns.str.startswith(("Gender_", "Smoking_", "Alcohol_", "Exercise_Freq_"))])

# Final feature set
features = numeric_features + one_hot_features

# List of diseases to predict
diseases = ["Obesity", "Hypertension", "Diabetes", "HeartDisease"]

# Dictionary to store models
models = {}

for disease in diseases:
    X = df[features]  # Use the correct features after encoding
    y = df[disease]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    models[disease] = model
    joblib.dump(model, f"{disease}_model.pkl")

print("Models trained and saved successfully!")
