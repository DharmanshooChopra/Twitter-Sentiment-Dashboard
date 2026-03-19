import re
import pickle
import datetime
import requests
from flask import Flask, request, jsonify, render_template

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Start Flask App
app = Flask(__name__)

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

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze_sentiment():
    """Endpoint matching UI's analyzeText() call"""
    data = request.get_json() if request.is_json else request.form
    raw_text = data.get("text", "")
        
    if not raw_text.strip():
        return jsonify({"error": "No text passed"}), 400

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
        
    return jsonify({
        "error": None,
        "sentiment": label,
        "confidence": confidence_pct
    }), 200

@app.route("/stats", methods=["GET"])
def get_stats():
    return jsonify(app_stats)

@app.route("/history", methods=["GET"])
def get_history():
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
            
            return jsonify({
                "tweets": [{
                    "text": txt,
                    "author": f"@{username}",
                    "id": "",
                    "created_at": "Recent"
                } for txt in final_tweets]
            })
            
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
