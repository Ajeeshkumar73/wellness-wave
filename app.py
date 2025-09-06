from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime
import os
import pandas as pd
import joblib

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "your_secret_key")

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["healthcare_db"]
users_col = db["users"]
doctors_col = db["doctors"]
appointments_col = db["appointments"]
predictions_col = db["predictions"]
messages_col = db["messages"]


# Load all models
diseases = ["Obesity", "Hypertension", "Diabetes", "HeartDisease"]
models = {d: joblib.load(f"{d}_model.pkl") for d in diseases}

def risk_status(prob):
    if prob > 0.7:
        return "High Risk"
    elif prob > 0.4:
        return "Intermediate Risk"
    else:
        return "Low Risk"

def metric_status(name, value):
    if name == "BMI":
        if value < 18.5: return "Underweight"
        elif value < 25: return "Normal"
        elif value < 30: return "Overweight"
        else: return "Obese"
    if name == "BloodSugar":
        if value < 100: return "Normal"
        elif value < 126: return "Prediabetes"
        else: return "High"
    if name == "BloodPressure":
        s,d = value
        if s < 120 and d < 80: return "Normal"
        elif s < 130 and d < 80: return "Elevated"
        elif s < 140 or d < 90: return "High BP Stage 1"
        else: return "High BP Stage 2"
    if name == "Cholesterol":
        if value < 200: return "Desirable"
        elif value < 240: return "Borderline High"
        else: return "High"
    return "Unknown"



@app.route('/predict', methods=['POST'])
def predict():
    data = request.form
    height = float(data['height'])
    weight = float(data['weight'])
    bmi = weight / ((height / 100) ** 2)
    
    input_data = pd.DataFrame([{
        "Age": int(data['age']),
        "Gender": data['gender'],
        "Height_cm": height,
        "Weight_kg": weight,
        "Smoking": data['smoking'],
        "Alcohol": data['alcohol'],
        "Exercise_Freq": data['exercise'],
        "Sleep_Hours": float(data['sleep']),
        "SystolicBP": float(data['systolic']),
        "DiastolicBP": float(data['diastolic']),
        "Cholesterol": float(data['cholesterol']),
        "BloodSugar": float(data['bloodSugar']),
        "BMI": bmi
    }])

    input_data = pd.get_dummies(input_data)
    # Align columns with models
    for disease in diseases:
        for col in models[disease].feature_names_in_:
            if col not in input_data.columns:
                input_data[col] = 0
        input_data = input_data[models[disease].feature_names_in_]

    results = {}
    for disease in diseases:
        prob = models[disease].predict_proba(input_data)[0][1]
        results[disease] = {
            "chance": f"{prob*100:.1f}%",
            "status": risk_status(prob)
        }

    metrics = {
        "BMI": {"value": round(bmi,1), "status": metric_status("BMI", bmi)},
        "BloodPressure": {"value": f"{data['systolic']}/{data['diastolic']}", 
                          "status": metric_status("BloodPressure", (float(data['systolic']), float(data['diastolic'])))},
        "BloodSugar": {"value": data['bloodSugar'], "status": metric_status("BloodSugar", float(data['bloodSugar']))},
        "Cholesterol": {"value": data['cholesterol'], "status": metric_status("Cholesterol", float(data['cholesterol']))},
    }

    return jsonify({"diseases": results, "metrics": metrics})




# Home page
@app.route("/")
def index():
    open_login = request.args.get("open_login", "false")
    return render_template("index.html", open_login=open_login)

# User registration
@app.route("/user_register", methods=["POST"])
def user_register():
    username = request.form.get("username", "").strip()
    email = request.form.get("email", "").strip()
    password = request.form.get("password", "")
    full_name = request.form.get("full_name", "").strip()
    age = request.form.get("age", "")
    gender = request.form.get("gender", "")
    phone = request.form.get("phone", "").strip()

    if users_col.find_one({"username": username}):
        flash("Username already taken. Try a different one.", "error")
        return redirect(url_for("index"))

    if users_col.find_one({"email": email}):
        flash("Email already registered. Try login instead.", "error")
        return redirect(url_for("index"))

    # Save user
    users_col.insert_one({
        "username": username,
        "email": email,
        "password": generate_password_hash(password),
        "full_name": full_name,
        "age": int(age) if age.isdigit() else None,
        "gender": gender,
        "phone": phone,
        "user_type": "user",
        "created_at": datetime.now()
    })

    flash("Registration successful! Please login.", "success")
    return redirect(url_for("index", open_login="true"))

# User login
@app.route("/user_login", methods=["POST"])
def user_login():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")

    user = users_col.find_one({"username": username})

    if user and check_password_hash(user.get("password", ""), password):
        session["username"] = username
        session["user_id"] = str(user["_id"])
        session["user_type"] = "user"
        flash("Login successful!", "success")
        return redirect(url_for("user_home"))
    else:
        flash("Invalid username or password.", "error")
        return redirect(url_for("index"))

# User dashboard
@app.route("/user_home")
def user_home():
    if 'user_id' not in session:
        return redirect(url_for("index"))

    user = users_col.find_one({"_id": ObjectId(session["user_id"])})

    recent_predictions = list(predictions_col.find(
        {"user_id": ObjectId(session["user_id"])}
    ).sort("created_at", -1).limit(5))

    upcoming_appointments = list(appointments_col.find({
        "user_id": ObjectId(session["user_id"]),
        "appointment_date": {"$gte": datetime.now()}
    }))

    return render_template(
        "user_home.html",
        user=user,
        recent_predictions=recent_predictions,
        upcoming_appointments=upcoming_appointments
    )

@app.route('/predict_page')
def predict_page():
    return render_template('predict_page.html')  # your prediction form page

@app.route('/back_page')
def back_page():
    return redirect(url_for('user_home'))





#doctor register
@app.route('/doctor_register', methods=['GET', 'POST'])
def doctor_register():
    if request.method == 'POST':
        username = request.form['username'].strip()
        email = request.form['email'].strip()
        password = request.form['password']
        full_name = request.form['full_name'].strip()
        specialization = request.form['specialization']
        qualification = request.form.get('qualification')
        experience = request.form.get('experience', type=int)
        phone = request.form.get('phone')
        address = request.form.get('address')
        consultation_fee = request.form.get('consultation_fee', type=float)

        # Check for duplicate username/email
        if doctors_col.find_one({"username": username}):
            flash('Username already exists', 'error')
            return redirect(url_for('index', open_doctor_register='true'))

        if doctors_col.find_one({"email": email}):
            flash('Email already exists', 'error')
            return redirect(url_for('index', open_doctor_register='true'))

        # Insert new doctor
        doctor = {
            "username": username,
            "email": email,
            "password": generate_password_hash(password),
            "full_name": full_name,
            "specialization": specialization,
            "qualification": qualification,
            "experience": experience,
            "phone": phone,
            "address": address,
            "consultation_fee": consultation_fee,
            #"photo_url": get_doctor_photo_url(specialization),  # Optional function
            "user_type": "doctor"
        }

        doctors_col.insert_one(doctor)

        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('index', open_doctor_login='true'))

    return redirect(url_for('index', open_doctor_register='true'))

#doctor login
@app.route('/doctor_login', methods=['GET', 'POST'])
def doctor_login():
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']

        doctor = doctors_col.find_one({"username": username})

        if doctor and check_password_hash(doctor.get("password", ""), password):
            session['doctor_id'] = str(doctor["_id"])
            session['user_type'] = 'doctor'
            session['username'] = doctor['username']
            flash('Login successful!', 'success')
            return redirect(url_for('doctor_home'))
        else:
            flash('Invalid credentials', 'error')

    return render_template('index')

#doctor dashboard
@app.route('/doctor_home')
def doctor_home():
    if 'doctor_id' not in session:
        return redirect(url_for('doctor_login'))

    doctor_id = ObjectId(session['doctor_id'])
    
    doctor = doctors_col.find_one({'_id': doctor_id})
    appointments = list(appointments_col.find({'doctor_id': doctor_id}).sort('appointment_date', -1))
    pending_appointments = list(appointments_col.find({'doctor_id': doctor_id, 'status': 'pending'}))
    unread_messages = list(messages_col.find({'doctor_id': doctor_id, 'is_read': False}))

    # Attach patient (user) info
    for appt in appointments:
        user_id = appt.get('user_id')
        if user_id:
            appt['user'] = users_col.find_one({'_id': user_id})

    for appt in pending_appointments:
        user_id = appt.get('user_id')
        if user_id:
            appt['user'] = users_col.find_one({'_id': user_id})

    for msg in unread_messages:
        user_id = msg.get('user_id')
        if user_id:
            msg['user'] = users_col.find_one({'_id': user_id})

    return render_template('doctor_home.html',
                           doctor=doctor,
                           appointments=appointments,
                           pending_appointments=pending_appointments,
                           unread_messages=unread_messages)



# Logout
@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully.", "success")
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(debug=True)
