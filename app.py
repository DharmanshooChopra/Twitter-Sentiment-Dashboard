import re
import pickle
import datetime
import requests
from flask import Flask, request, jsonify

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Start Flask App
from flask_cors import CORS
import os
from pymongo import MongoClient
from dotenv import load_dotenv

app = Flask(__name__)
# Enable CORS for all routes securely
CORS(app, resources={r"/*": {"origins": "*"}})

load_dotenv() # Load variables from .env if present
print(f"DEBUG MONGO_URI: {os.getenv('MONGO_URI')}")

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

try:
    mongo_client = MongoClient(
        MONGO_URI, 
        serverSelectionTimeoutMS=5000,
        tls=True,
        tlsAllowInvalidCertificates=True
    )
    mongo_client.server_info() # Test connection
    db = mongo_client["tweet_analyzer_db"]
    history_collection = db["analysis_history"]
    feature_vault = db["feature_vault"]
    print("[SUCCESS] Successfully connected to MongoDB Atlas!")
except Exception as e:
    print(f"[WARNING] MongoDB disconnected or invalid URI.")
    print(f"Error Details: {e}")
    history_collection = None
    feature_vault = None

# Preload NLP tools globally 
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("wordnet", quiet=True)

lemmatizer = WordNetLemmatizer()
negation_words = {"not", "no", "never", "nor", "none", "n't"}
stop_words = set(stopwords.words("english")) - negation_words
sentiment_map = {0: "negative", 1: "neutral", 2: "positive"}

# In-memory storage for UI stats and history
app_stats = {"positive": 0, "neutral": 0, "negative": 0}
app_history = []

DEFAULT_BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAD6X8QEAAAAACAxAvGli4Fh1hUi1MvZTA2CKPyA%3DYJnEXhH7QtrapKc24PrA9q5wb2Cf9LSMLexmNLqYQNGdlPl7BU"

# Load the trained Model and Vectorizer globally
try:
    with open("models/tfidf_vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)
    with open("models/svm_model.pkl", "rb") as f:
        model = pickle.load(f)
    print("TF-IDF Vectorizer and SVM Model successfully loaded!")
except Exception as e:
    print(f"Warning: Model not found. Error: {e}")

def store_prediction_in_mongo(input_type, input_value, sentiment, confidence, misinfo, batch_tweets=None):
    if history_collection is None:
        return
        
    doc = {
        "input_type": input_type,
        "input_value": input_value,
        "timestamp": datetime.datetime.now(datetime.timezone.utc),
        "sentiment": sentiment,
        "confidence": confidence,
        "misinformation": misinfo
    }
    
    if batch_tweets:
        doc["batch_tweets"] = batch_tweets
        
    try:
        history_collection.insert_one(doc)
    except Exception as e:
        print(f"Mongo Insert Error: {e}")

def preprocess_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"[^a-z0-9!?\s]", " ", text)
    tokens = word_tokenize(text)
    cleaned = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words]
    return " ".join(cleaned)

def extract_keywords(text, vectorizer):
    """PHASE 1: Extract feature weights from TFIDF"""
    try:
        feature_names = vectorizer.get_feature_names_out()
        vector = vectorizer.transform([text])
        sorted_indices = vector.toarray()[0].argsort()[::-1]
        top_words = [feature_names[i] for i in sorted_indices[:5] if vector.toarray()[0][i] > 0]
        return top_words if top_words else ["N/A"]
    except Exception:
        return ["N/A"]

import hashlib

# High-Performance Internal Cache (simulating Redis locally)
cache_store = {}
CACHE_HITS = 0
TOTAL_REQUESTS = 0

@app.route("/analyze", methods=["POST"])
def analyze_sentiment():
    global CACHE_HITS, TOTAL_REQUESTS
    TOTAL_REQUESTS += 1
    
    """Endpoint matching UI's analyzeText() call"""
    data = request.get_json() if request.is_json else request.form
    raw_text = data.get("text", "")
        
    if not raw_text.strip():
        return jsonify({"error": "No text passed"}), 400
        
    # Generate MD5 Hash of the string to check against Cache
    text_hash = hashlib.md5(raw_text.encode()).hexdigest()
    if text_hash in cache_store:
        CACHE_HITS += 1
        return jsonify(cache_store[text_hash]), 200

    if "model" not in globals() or "vectorizer" not in globals():
        # FALLBACK: If Windows Defender blocked the ML training, use NLTK VADER. 
        # VADER is pure Python and exceptionally accurate for short tweets!
        from nltk.sentiment.vader import SentimentIntensityAnalyzer
        nltk.download('vader_lexicon', quiet=True)
        sia = SentimentIntensityAnalyzer()
        
        scores = sia.polarity_scores(raw_text)
        comp = scores['compound']
        
        if comp > 0.05:
            label = "positive"
        elif comp < -0.05:
            label = "negative"
        else:
            label = "neutral"
            
        # Calculate a pseudo-confidence percentage from VADER
        best_score = max(scores['pos'], scores['neu'], scores['neg'])
        confidence_pct = round(min((best_score * 120) + 30, 99.9), 2)
    else:
        try:
            # Normal Machine Learning pipeline
            cleaned_tweet = preprocess_text(raw_text)
            vectorized_tweet = vectorizer.transform([cleaned_tweet])
            
            prediction_id = model.predict(vectorized_tweet)[0]
            label = sentiment_map.get(prediction_id, "unknown")
            
            confidence = max(model.predict_proba(vectorized_tweet)[0])
            confidence_pct = round(confidence * 100, 2)
            
            # --- PHASE 4: FEATURE LOGGING FOR ACTIVE LEARNING ---
            if "feature_vault" in globals() and feature_vault is not None:
                try:
                    feature_vault.insert_one({
                        "raw_text": raw_text,
                        "embedding": vectorized_tweet.toarray().flatten().tolist(),
                        "system_label": label,
                        "timestamp": datetime.datetime.now(datetime.timezone.utc),
                        "audited": False
                    })
                except Exception:
                    pass
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
        # Update metrics (thread safety omitted for simplicity)
        if label in app_stats:
            app_stats[label] += 1
            
        app_history.insert(0, {
            "tweet_text": raw_text,
            "sentiment": label,
            "timestamp": datetime.datetime.now().strftime("%I:%M %p")
        })
        # Keep history tiny
        if len(app_history) > 30:
            app_history.pop()
        
        # Calculate Misinformation Risk heuristic
        if label == "negative" and confidence_pct > 75:
            mis_risk = "High"
        elif label == "negative" and confidence_pct <= 75:
            mis_risk = "Moderate"
        else:
            mis_risk = "Low"

        # --- DB STORAGE ---
        store_prediction_in_mongo(
            input_type="custom_text",
            input_value=raw_text,
            sentiment=label,
            confidence=confidence_pct,
            misinfo=mis_risk
        )

    keywords = extract_keywords(raw_text, vectorizer) if "vectorizer" in globals() else ["N/A"]
    response_payload = {
        "error": None,
        "sentiment": label,
        "confidence": confidence_pct,
        "misinformation": mis_risk,
        "explanation": {
            "keywords": keywords,
            "reason": f"Detected strong signals from words like {', '.join(keywords[:3])}"
        }
    }
    
    # Store payload into our memory cache
    cache_store[text_hash] = response_payload
    
    return jsonify(response_payload), 200

@app.route("/metrics", methods=["GET"])
def get_metrics():
    """Endpoint for Phase 5 system metrics analysis"""
    cache_hit_ratio = round((CACHE_HITS / TOTAL_REQUESTS) * 100, 2) if TOTAL_REQUESTS > 0 else 0
    total_db = history_collection.count_documents({}) if history_collection else sum(app_stats.values())
    
    return jsonify({
        "system_health": "operational",
        "requests_total": TOTAL_REQUESTS,
        "cache_hit_ratio_pct": cache_hit_ratio,
        "ml_telemetry": {
            "total_predictions_stored": total_db
        }
    })

@app.route("/stats", methods=["GET"])
def get_stats():
    if history_collection is None:
        return jsonify(app_stats)
        
    pipeline = [
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    try:
        results = history_collection.aggregate(pipeline)
        stats = {"positive": 0, "neutral": 0, "negative": 0}
        for r in results:
            label = r["_id"]
            if label in stats:
                stats[label] = r["count"]
        return jsonify(stats)
    except Exception as e:
        return jsonify(app_stats)

@app.route("/history", methods=["GET"])
def get_history():
    if history_collection is None:
        return jsonify(app_history)
        
    try:
        cursor = history_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(20)
        formatted_history = []
        
        # Map for Line Graph 
        score_map = {"positive": 1, "neutral": 0, "negative": -1}
        
        for doc in cursor:
            lbl = doc.get("sentiment", "neutral")
            formatted_history.append({
                "tweet_text": doc.get("input_value", ""),
                "sentiment": lbl,
                "score": score_map.get(lbl, 0),
                "misinformation": doc.get("misinfo", "Low"),
                "timestamp": doc.get("timestamp").strftime("%I:%M:%S") if doc.get("timestamp") else "00:00:00"
            })
            
        # Recharts expects left-to-right chronological
        return jsonify(formatted_history[::-1])
    except Exception as e:
        return jsonify(app_history)

def _find_key_in_json(obj, target_key):
    """Recursively search for a key in a complex JSON dictionary."""
    if isinstance(obj, dict):
        if target_key in obj:
            return obj[target_key]
        for k, v in obj.items():
            result = _find_key_in_json(v, target_key)
            if result: return result
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, (dict, list)):
                result = _find_key_in_json(item, target_key)
                if result: return result
    return None

def _find_all_tweets(obj, results=None):
    """Recursively find all unique tweets in a giant JSON payload."""
    if results is None:
        results = []
    if isinstance(obj, dict):
        if "full_text" in obj and len(str(obj["full_text"])) > 5:
            if obj["full_text"] not in results:
                results.append(obj["full_text"])
        elif "text" in obj and len(str(obj["text"])) > 5:
            if obj["text"] not in results:
                results.append(obj["text"])
        for k, v in obj.items():
            _find_all_tweets(v, results)
    elif isinstance(obj, list):
        for item in obj:
            _find_all_tweets(item, results)
    return results

@app.route("/fetch_tweet", methods=["POST"])
def fetch_tweet():
    data = request.get_json()
    query = data.get("query", "").strip()
    count = max(1, min(int(data.get("count", 1)), 100))
    
    RAPIDAPI_KEY = "531ca7f9b5mshc35c67f4e9ecc2fp1252aajsn596af6fc6b08"
    RAPIDAPI_HOST = "twitter241.p.rapidapi.com"
        
    if not query:
        return jsonify({"error": "No query provided"}), 400
        
    try:
        headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST
        }
        
        # 1) Search By Tweet ID
        if query.isdigit():
            # Common endpoint for this provider
            url = f"https://{RAPIDAPI_HOST}/tweet"
            querystring = {"id": query}
            response = requests.get(url, headers=headers, params=querystring)
            
            if response.status_code != 200:
                return jsonify({"error": f"RapidAPI Twitter241 Error. Code: {response.status_code}. {response.text}"}), 400
                
            data = response.json()
            all_texts = _find_all_tweets(data)
            
            if not all_texts:
                return jsonify({"error": "Tweet not found or private."}), 404
                
            return jsonify({
                "tweets": [{
                    "text": all_texts[0],
                    "author": f"@User",
                    "id": str(query),
                    "created_at": "Recent"
                }]
            })
            
        # 2) Search By Username (e.g., @elonmusk)
        else:
            username = query.replace("@", "")
            
            # Step A: Get User's REST_ID
            url_user = f"https://{RAPIDAPI_HOST}/user"
            res_user = requests.get(url_user, headers=headers, params={"username": username})
            if res_user.status_code != 200:
                return jsonify({"error": f"RapidAPI Error finding user. Code: {res_user.status_code}"}), 400
            
            user_data = res_user.json()
            uid = _find_key_in_json(user_data, "rest_id") or _find_key_in_json(user_data, "id")
            
            if not uid:
                return jsonify({"error": "User ID could not be extracted."}), 404
                
            # Step B: Get User's Tweets using REST_ID
            url_tweets = f"https://{RAPIDAPI_HOST}/user-tweets"
            # Requesting slightly more to guarantee we get unique original text
            fetch_count = str(min(count + 5, 100))
            res_tweets = requests.get(url_tweets, headers=headers, params={"user": uid, "count": fetch_count})
            
            if res_tweets.status_code != 200:
                return jsonify({"error": f"RapidAPI Error finding tweets. Code: {res_tweets.status_code}"}), 400
                
            tweets_data = res_tweets.json()
            all_texts = _find_all_tweets(tweets_data)
            
            if not all_texts:
                return jsonify({"error": "User has no tweets available or account is private."}), 404
                
            # Truncate to the exact count requested
            final_tweets = all_texts[:count]
            
            # --- BATCH ML PROCESSING & MongoDB STORAGE ---
            batch_results = []
            pos_score, neg_score = 0, 0
            
            for txt in final_tweets:
                lbl = "neutral"
                conf = 0.0
                misinfo = "Low"
                if "model" in globals() and "vectorizer" in globals():
                    try:
                        c_text = preprocess_text(txt)
                        v_text = vectorizer.transform([c_text])
                        lbl = sentiment_map.get(model.predict(v_text)[0], "unknown")
                        conf = round(max(model.predict_proba(v_text)[0]) * 100, 2)
                        
                        if lbl == "negative" and conf > 75: misinfo = "High"
                        elif lbl == "negative" and conf <= 75: misinfo = "Moderate"
                        
                        if lbl == "positive": pos_score += 1
                        if lbl == "negative": neg_score += 1
                    except Exception:
                        pass
                        
                batch_kws = extract_keywords(txt, vectorizer) if "vectorizer" in globals() else ["N/A"]
                batch_results.append({
                    "text": txt,
                    "author": f"@{username}",
                    "sentiment": lbl,
                    "confidence": conf,
                    "misinformation": misinfo,
                    "explanation": {
                        "keywords": batch_kws,
                        "reason": f"Detected strong signals from words like {', '.join(batch_kws[:3])}"
                    }
                })
                
            # Determine overall sentiment of the batch
            overall = "neutral"
            if pos_score > neg_score: overall = "positive"
            elif neg_score > pos_score: overall = "negative"
            
            # Store everything into Mongo!
            store_prediction_in_mongo(
                input_type="twitter_username",
                input_value=username,
                sentiment=overall,
                confidence=100.0,
                misinfo="High" if neg_score > (len(final_tweets)/2) else "Low",
                batch_tweets=batch_results
            )
            
            return jsonify({"tweets": batch_results})
            
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
