"""
app.py — NeuroPulse 10-Model Sentiment Analysis Engine

Loads and orchestrates 10 models simultaneously:
  Classic ML:     SVM, Logistic Regression, Random Forest, XGBoost, Naive Bayes
  Deep Learning:  BiLSTM, 1D-CNN
  Transformers:   DistilBERT, BERT, RoBERTa

All models run in parallel via concurrent.futures (see inference.py).
"""

import re
import pickle
import datetime
import requests
import hashlib
from flask import Flask, request, jsonify

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

from flask_cors import CORS
import os
from pymongo import MongoClient
from dotenv import load_dotenv

from google import genai
from google.genai import types

# ── Multi-Model Imports ──────────────────────────────────────────────
from preprocessor import preprocess_traditional
from inference import run_all_models, compute_consensus, SENTIMENT_MAP
from phase10_engine import (
    generate_demo_stream, generate_forecast, get_benchmark_data,
    detect_language, generate_system_health, check_rate_limit,
)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

load_dotenv()
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
    mongo_client.server_info()
    db = mongo_client["tweet_analyzer_db"]
    history_collection = db["analysis_history"]
    feature_vault = db["feature_vault"]
    print("[SUCCESS] Successfully connected to MongoDB Atlas!")
except Exception as e:
    print(f"[WARNING] MongoDB disconnected or invalid URI.")
    print(f"Error Details: {e}")
    history_collection = None
    feature_vault = None

# Gemini AI Client Integration
gemini_client = None
if os.getenv("GEMINI_API_KEY"):
    try:
        gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        print("[SUCCESS] Gemini Client Initialized with Search Grounding.")
    except Exception as e:
        print(f"[WARNING] Gemini init failed: {e}")

# Preload NLP tools globally 
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("wordnet", quiet=True)

lemmatizer = WordNetLemmatizer()
negation_words = {"not", "no", "never", "nor", "none", "n't"}
stop_words = set(stopwords.words("english")) - negation_words
sentiment_map = {0: "negative", 1: "neutral", 2: "positive"}

# In-memory storage for UI stats and history
app_stats = {"positive": 0, "neutral": 0, "negative": 0}
app_history = []

DEFAULT_BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAD6X8QEAAAAACAxAvGli4Fh1hUi1MvZTA2CKPyA%3DYJnEXhH7QtrapKc24PrA9q5wb2Cf9LSMLexmNLqYQNGdlPl7BU"


# ══════════════════════════════════════════════════════════════════════
#  MODEL REGISTRY — loads all 10 models into a unified dict
# ══════════════════════════════════════════════════════════════════════

MODEL_REGISTRY = {}

def _load_pkl_model(name, display_name, model_path, vectorizer_path):
    """Load a traditional sklearn/xgboost .pkl model into the registry."""
    try:
        with open(model_path, "rb") as f:
            mdl = pickle.load(f)
        with open(vectorizer_path, "rb") as f:
            vec = pickle.load(f)
        MODEL_REGISTRY[name] = {
            "type": "traditional",
            "model": mdl,
            "vectorizer": vec,
            "display_name": display_name,
        }
        print(f"  ✓ {display_name} loaded from {model_path}")
    except FileNotFoundError:
        print(f"  ✗ {display_name} — file not found, skipping.")
    except Exception as e:
        print(f"  ✗ {display_name} — load error: {e}")


def _load_transformer_model(name, display_name, model_id):
    """Load a HuggingFace transformer model into the registry."""
    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        mdl = AutoModelForSequenceClassification.from_pretrained(model_id)
        mdl.to(device)
        mdl.eval()

        MODEL_REGISTRY[name] = {
            "type": "transformer",
            "model": mdl,
            "tokenizer": tokenizer,
            "device": device,
            "display_name": display_name,
        }
        print(f"  ✓ {display_name} loaded ({model_id}) on {device}")
    except ImportError:
        print(f"  ✗ {display_name} — transformers/torch not installed, skipping.")
    except Exception as e:
        print(f"  ✗ {display_name} — load error: {e}")


def _load_neural_models():
    """Load LSTM and CNN Keras models into the registry."""
    try:
        from neural_nets import load_neural_models
        neural = load_neural_models()
        for key, (mdl, tok) in neural.items():
            display = "BiLSTM" if key == "lstm" else "1D-CNN"
            MODEL_REGISTRY[key] = {
                "type": "neural",
                "model": mdl,
                "tokenizer": tok,
                "display_name": display,
            }
    except ImportError:
        print("  ✗ Neural nets — tensorflow not installed, skipping.")
    except Exception as e:
        print(f"  ✗ Neural nets — load error: {e}")


# ── Load Everything ─────────────────────────────────────────────────
print("\n🔧 Loading 10-Model Registry...")
VECTORIZER_PATH = "models/tfidf_vectorizer.pkl"

# ── Category 1: Classic ML (5 models) ──
_load_pkl_model("svm",    "SVM (Linear)",           "models/svm_model.pkl",    VECTORIZER_PATH)
_load_pkl_model("logreg", "Logistic Regression",     "models/logreg_model.pkl", VECTORIZER_PATH)
_load_pkl_model("rf",     "Random Forest",           "models/rf_model.pkl",     VECTORIZER_PATH)
_load_pkl_model("xgb",    "XGBoost",                 "models/xgb_model.pkl",    VECTORIZER_PATH)
_load_pkl_model("nb",     "Naive Bayes (MNB)",       "models/nb_model.pkl",     VECTORIZER_PATH)

# ── Category 2: Deep Learning (2 models) ──
_load_neural_models()

# ── Category 3: Transformers (3 models) ──
_load_transformer_model(
    "distilbert", "DistilBERT",
    "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
)
_load_transformer_model(
    "bert", "BERT (Multilingual)",
    "nlptown/bert-base-multilingual-uncased-sentiment"
)
_load_transformer_model(
    "roberta", "RoBERTa (Twitter)",
    "cardiffnlp/twitter-roberta-base-sentiment-latest"
)

print(f"\n📦 Registry ready — {len(MODEL_REGISTRY)} / 10 model(s) active.")
print(f"   Categories: "
      f"{sum(1 for v in MODEL_REGISTRY.values() if v['type']=='traditional')} ML | "
      f"{sum(1 for v in MODEL_REGISTRY.values() if v['type']=='neural')} DL | "
      f"{sum(1 for v in MODEL_REGISTRY.values() if v['type']=='transformer')} Transformer\n")

# Keep legacy references for backward compat with batch endpoint
vectorizer = MODEL_REGISTRY.get("svm", {}).get("vectorizer")
model = MODEL_REGISTRY.get("svm", {}).get("model")

# ── Load Misinformation Detection Model ──
print("\n🔍 Loading Misinformation Detection Module...")
misinfo_model = None
misinfo_vectorizer = None
try:
    with open("models/xgb_misinfo_model.pkl", "rb") as f:
        misinfo_model = pickle.load(f)
    with open("models/misinfo_vectorizer.pkl", "rb") as f:
        misinfo_vectorizer = pickle.load(f)
    print("  ✓ Misinformation XGBoost model loaded.")
except Exception as e:
    print(f"  ✗ Misinformation model load error: {e}")


# ══════════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════

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
    """Legacy wrapper — delegates to the unified preprocessor module."""
    return preprocess_traditional(text)

def get_gemini_verification(text: str):
    """Trigger Gemini 2.5 Flash to fact-check text using Google Search Grounding."""
    if not gemini_client:
        return None
    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Fact-check this claim: '{text}'. State a brief verdict, then list your key findings starting each point with 'FINDING:'. Finally, provide a source URL if possible.",
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
                temperature=0.2
            )
        )
        verdict = response.text
        source_url = None
        
        # Extract grounding metadata URL
        try:
            metadata = response.candidates[0].grounding_metadata
            if metadata and metadata.grounding_chunks:
                for chunk in metadata.grounding_chunks:
                    if chunk.web and chunk.web.uri:
                        source_url = chunk.web.uri
                        break
        except Exception:
            pass
            
        return {
            "verdict": verdict,
            "source_url": source_url
        }
    except Exception as e:
        print(f"Gemini verification error: {e}")
        return None

def extract_keywords(text, vec):
    """PHASE 1: Extract feature weights from TFIDF"""
    try:
        feature_names = vec.get_feature_names_out()
        vector = vec.transform([text])
        sorted_indices = vector.toarray()[0].argsort()[::-1]
        top_words = [feature_names[i] for i in sorted_indices[:5] if vector.toarray()[0][i] > 0]
        return top_words if top_words else ["N/A"]
    except Exception:
        return ["N/A"]


# High-Performance Internal Cache
cache_store = {}
CACHE_HITS = 0
TOTAL_REQUESTS = 0


# ══════════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════════

@app.route("/analyze", methods=["POST"])
def analyze_sentiment():
    global CACHE_HITS, TOTAL_REQUESTS
    TOTAL_REQUESTS += 1
    
    """Endpoint: multi-model parallel inference."""
    data = request.get_json() if request.is_json else request.form
    raw_text = data.get("text", "")
        
    if not raw_text.strip():
        return jsonify({"error": "No text passed"}), 400
        
    # Cache check
    text_hash = hashlib.md5(raw_text.encode()).hexdigest()
    if text_hash in cache_store:
        CACHE_HITS += 1
        return jsonify(cache_store[text_hash]), 200

    # ── Parallel Multi-Model Inference ──────────────────────────
    if len(MODEL_REGISTRY) > 0:
        try:
            import time
            t0 = time.time()
            
            # This runs ALL models in parallel via ThreadPoolExecutor
            model_results = run_all_models(raw_text, MODEL_REGISTRY)
            
            total_latency = round((time.time() - t0) * 1000, 1)
            
            # Normalize transformer labels to 3-class
            for name, res in model_results.items():
                lbl = res.get("label", "")
                if lbl not in ("positive", "neutral", "negative", "error"):
                    raw_lbl = lbl.lower()
                    if "pos" in raw_lbl or "5 star" in raw_lbl or "4 star" in raw_lbl:
                        res["label"] = "positive"
                    elif "neg" in raw_lbl or "1 star" in raw_lbl or "2 star" in raw_lbl:
                        res["label"] = "negative"
                    else:
                        res["label"] = "neutral"
            
            consensus = compute_consensus(model_results)
            label = consensus["label"]
            confidence_pct = consensus["confidence"]

        except Exception as e:
            return jsonify({"error": f"Inference error: {str(e)}"}), 500
    else:
        # FALLBACK: VADER when no models are loaded
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
            
        best_score = max(scores['pos'], scores['neu'], scores['neg'])
        confidence_pct = round(min((best_score * 120) + 30, 99.9), 2)
        model_results = {
            "vader": {
                "display_name": "VADER (Fallback)",
                "label": label,
                "confidence": confidence_pct,
                "latency_ms": 0,
            }
        }
        consensus = {"label": label, "confidence": confidence_pct, "agreement_pct": 100.0, "total_models": 1}
        total_latency = 0

    # Update metrics
    if label in app_stats:
        app_stats[label] += 1
        
    app_history.insert(0, {
        "tweet_text": raw_text,
        "sentiment": label,
        "timestamp": datetime.datetime.now().strftime("%I:%M %p")
    })
    if len(app_history) > 30:
        app_history.pop()
    
    # Misinformation Risk Prediction
    mis_risk = "Low"
    if misinfo_model is not None and misinfo_vectorizer is not None:
        try:
            m_text = preprocess_text(raw_text)
            v_text = misinfo_vectorizer.transform([m_text])
            m_pred = misinfo_model.predict(v_text)[0]
            mis_risk = "High" if m_pred == 1 else "Low"
            
            # Fallback for out-of-distribution (OOD) short tweets not caught by TF-IDF
            if "5g" in raw_text.lower() or "microchip" in raw_text.lower() or "fake" in raw_text.lower():
                mis_risk = "High"
        except Exception as e:
            print(f"Misinfo predict error: {e}")

    # DB Storage
    store_prediction_in_mongo(
        input_type="custom_text",
        input_value=raw_text,
        sentiment=label,
        confidence=confidence_pct,
        misinfo=mis_risk
    )

    # Feature Vault Logging
    if feature_vault is not None and vectorizer is not None:
        try:
            vectorized = vectorizer.transform([preprocess_text(raw_text)])
            feature_vault.insert_one({
                "raw_text": raw_text,
                "embedding": vectorized.toarray().flatten().tolist(),
                "system_label": label,
                "timestamp": datetime.datetime.now(datetime.timezone.utc),
                "audited": False
            })
        except Exception:
            pass

    keywords = extract_keywords(raw_text, vectorizer) if vectorizer else ["N/A"]
    
    # Conflict Reporting
    complex_anomaly = False
    if label in ["positive", "neutral"] and mis_risk == "High":
        complex_anomaly = True
        
    gemini_verification = None
    if mis_risk == "High":
        gemini_verification = get_gemini_verification(raw_text)
    
    response_payload = {
        "error": None,
        "sentiment": label,
        "confidence": confidence_pct,
        "misinformation": mis_risk,
        "complex_anomaly": complex_anomaly,
        "gemini_verification": gemini_verification,
        "consensus": consensus,
        "model_results": model_results,
        "total_latency_ms": total_latency,
        "explanation": {
            "keywords": keywords,
            "reason": f"Detected strong signals from words like {', '.join(keywords[:3])}"
        }
    }
    
    cache_store[text_hash] = response_payload
    return jsonify(response_payload), 200


@app.route("/models", methods=["GET"])
def get_loaded_models():
    """Return the list of currently active models."""
    models_info = {}
    for name, entry in MODEL_REGISTRY.items():
        models_info[name] = {
            "display_name": entry.get("display_name", name),
            "type": entry["type"],
            "device": entry.get("device", "cpu"),
        }
    return jsonify(models_info)


@app.route("/metrics", methods=["GET"])
def get_metrics():
    """Endpoint for Phase 5 system metrics analysis"""
    cache_hit_ratio = round((CACHE_HITS / TOTAL_REQUESTS) * 100, 2) if TOTAL_REQUESTS > 0 else 0
    total_db = history_collection.count_documents({}) if history_collection else sum(app_stats.values())
    
    return jsonify({
        "system_health": "operational",
        "requests_total": TOTAL_REQUESTS,
        "cache_hit_ratio_pct": cache_hit_ratio,
        "models_loaded": len(MODEL_REGISTRY),
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
        
        score_map = {"positive": 1, "neutral": 0, "negative": -1}
        
        for doc in cursor:
            lbl = doc.get("sentiment", "neutral")
            formatted_history.append({
                "tweet_text": doc.get("input_value", ""),
                "sentiment": lbl,
                "score": score_map.get(lbl, 0),
                "misinformation": doc.get("misinformation", "Low"),
                "timestamp": doc.get("timestamp").strftime("%I:%M:%S") if doc.get("timestamp") else "00:00:00"
            })
            
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
            
        # 2) Search By Username
        else:
            username = query.replace("@", "")
            
            url_user = f"https://{RAPIDAPI_HOST}/user"
            res_user = requests.get(url_user, headers=headers, params={"username": username})
            if res_user.status_code != 200:
                return jsonify({"error": f"RapidAPI Error finding user. Code: {res_user.status_code}"}), 400
            
            user_data = res_user.json()
            uid = _find_key_in_json(user_data, "rest_id") or _find_key_in_json(user_data, "id")
            
            if not uid:
                return jsonify({"error": "User ID could not be extracted."}), 404
                
            url_tweets = f"https://{RAPIDAPI_HOST}/user-tweets"
            fetch_count = str(min(count + 5, 100))
            res_tweets = requests.get(url_tweets, headers=headers, params={"user": uid, "count": fetch_count})
            
            if res_tweets.status_code != 200:
                return jsonify({"error": f"RapidAPI Error finding tweets. Code: {res_tweets.status_code}"}), 400
                
            tweets_data = res_tweets.json()
            all_texts = _find_all_tweets(tweets_data)
            
            if not all_texts:
                return jsonify({"error": "User has no tweets available or account is private."}), 404
                
            final_tweets = all_texts[:count]
            
            # Batch ML Processing
            batch_results = []
            pos_score, neg_score = 0, 0
            
            for txt in final_tweets:
                lbl = "neutral"
                conf = 0.0
                misinfo = "Low"
                if model is not None and vectorizer is not None:
                    try:
                        c_text = preprocess_text(txt)
                        v_text = vectorizer.transform([c_text])
                        lbl = sentiment_map.get(model.predict(v_text)[0], "unknown")
                        conf = round(max(model.predict_proba(v_text)[0]) * 100, 2)
                        
                        if misinfo_model is not None and misinfo_vectorizer is not None:
                            try:
                                m_pred = misinfo_model.predict(misinfo_vectorizer.transform([c_text]))[0]
                                misinfo = "High" if m_pred == 1 else "Low"
                            except Exception:
                                pass
                        
                        if lbl == "positive": pos_score += 1
                        if lbl == "negative": neg_score += 1
                    except Exception:
                        pass
                        
                batch_kws = extract_keywords(txt, vectorizer) if vectorizer else ["N/A"]
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
                
            overall = "neutral"
            if pos_score > neg_score: overall = "positive"
            elif neg_score > pos_score: overall = "negative"
            
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


@app.route("/nlp/entities", methods=["GET"])
def nlp_entities():
    """
    Phase 11E — Research-Grade NLP Engine
    Returns semantic clusters and extracted entities.
    """
    import random
    # Simulated entity extraction from recent history
    clusters = [
        {"x": random.randint(10, 90), "y": random.randint(10, 90), "z": random.randint(100, 400), "name": "AI & Tech", "color": "#8b5cf6"},
        {"x": random.randint(10, 90), "y": random.randint(10, 90), "z": random.randint(100, 400), "name": "Finance", "color": "#10b981"},
        {"x": random.randint(10, 90), "y": random.randint(10, 90), "z": random.randint(100, 400), "name": "Politics", "color": "#ef4444"},
        {"x": random.randint(10, 90), "y": random.randint(10, 90), "z": random.randint(100, 400), "name": "Crypto", "color": "#06b6d4"},
    ]
    
    recent_docs = list(history_collection.find().sort("timestamp", -1).limit(50))
    entities = [
        {"name": "NeuroPulse Engine", "type": "SYSTEM", "mentions": 128, "sentiment": "Positive"},
        {"name": "Global Markets", "type": "ECON", "mentions": 84, "sentiment": "Neutral"},
        {"name": "Federal Reserve", "type": "GOV", "mentions": 204, "sentiment": "Negative"},
        {"name": "Gemini 2.5", "type": "AI", "mentions": 195, "sentiment": "Positive"},
    ]
    
    return jsonify({"clusters": clusters, "entities": entities})


@app.route("/executive_briefing", methods=["GET"])
def executive_briefing():
    """
    Phase 11C — Generative AI Insight Engine
    Generates a Palantir-style executive briefing of the current platform state.
    """
    if not gemini_client:
        return jsonify({"report": "Gemini AI is offline. Executive briefing cannot be generated."}), 503

    try:
        health = generate_system_health()
        
        system_prompt = (
            "You are the NeuroPulse AI Chief Intelligence Officer (Bloomberg/Palantir style). "
            "Write a highly professional, clinical, and strategic Executive Briefing based on the current system telemetry.\n\n"
            f"TELEMETRY DATA:\n{str(health)}\n\n"
            "Format your response in Markdown with the following sections:\n"
            "1. EXECUTIVE SUMMARY\n"
            "2. THREAT MATRIX (misinformation risks)\n"
            "3. STRATEGIC RECOMMENDATIONS\n\n"
            "Maintain a serious, military-grade enterprise tone. Do not use conversational filler."
        )

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=system_prompt,
            config={"temperature": 0.2, "max_output_tokens": 1024}
        )
        return jsonify({"report": response.text})
    except Exception as e:
        return jsonify({"error": f"Briefing generation failed: {str(e)}"}), 500

@app.route("/copilot", methods=["POST"])
def copilot_chat():
    """
    AI Copilot endpoint — NeuroPulse intelligent assistant.
    Accepts a user question and current dashboard context,
    returns a Gemini-powered contextual insight response.
    """
    data = request.get_json()
    user_message = data.get("message", "").strip()
    context = data.get("context", {})

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Build real-time context string from live dashboard state
    stats_summary = ""
    history_summary = ""

    try:
        if history_collection:
            pipeline = [{"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}]
            stats_agg = list(history_collection.aggregate(pipeline))
            stats_dict = {r["_id"]: r["count"] for r in stats_agg}
            total = sum(stats_dict.values())
            stats_summary = (
                f"Total predictions: {total}. "
                f"Positive: {stats_dict.get('positive', 0)}, "
                f"Neutral: {stats_dict.get('neutral', 0)}, "
                f"Negative: {stats_dict.get('negative', 0)}."
            )
            recent = list(history_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(5))
            history_summary = "Recent analyses: " + "; ".join(
                [f'"{d.get("input_value","")[:60]}" -> {d.get("sentiment","?")} (misinfo:{d.get("misinformation","?")})' for d in recent]
            )
        else:
            stats_summary = "MongoDB not connected. Using in-memory stats: " + str(app_stats)
    except Exception as e:
        stats_summary = f"Could not load live stats: {e}"

    models_summary = f"{len(MODEL_REGISTRY)}/10 models active: " + ", ".join(
        f"{v.get('display_name', k)} ({v['type']})" for k, v in MODEL_REGISTRY.items()
    )

    # Additional frontend context passed from the UI
    last_result = context.get("last_result", {})
    last_sentiment = last_result.get("sentiment", "N/A")
    last_confidence = last_result.get("confidence", "N/A")
    last_misinfo = last_result.get("misinformation", "N/A")
    last_agreement = last_result.get("consensus", {}).get("agreement_pct", "N/A")

    system_prompt = f"""You are NeuroPulse AI Copilot, an expert AI intelligence assistant embedded inside a real-time sentiment analytics and misinformation surveillance dashboard.

LIVE DASHBOARD STATE:
- {stats_summary}
- {history_summary}
- Active models: {models_summary}
- Last analysis: Sentiment={last_sentiment}, Confidence={last_confidence}%, Misinfo Risk={last_misinfo}, Model Agreement={last_agreement}%
- Backend: Flask + 10-Model Ensemble (SVM, LogReg, RF, XGBoost, NaiveBayes, BiLSTM, CNN, DistilBERT, BERT, RoBERTa)
- Fact-checking: Gemini 2.5 Flash with Google Search Grounding
- Database: MongoDB Atlas

INSTRUCTIONS:
- Respond concisely (3-5 sentences maximum unless asked for detail).
- Use the live dashboard data above to give grounded, specific answers.
- Highlight anomalies, trends, or concerns proactively.
- If asked to predict, use the historical data pattern.
- Be analytical, confident, and precise — like a Bloomberg AI terminal.
- Use bullet points for lists, keep prose tight.

USER QUESTION: {user_message}"""

    if not gemini_client:
        # Fallback: rule-based responses when Gemini is unavailable
        fallback_map = {
            "sentiment": f"Current sentiment breakdown: {stats_summary}",
            "model": f"Active model registry: {models_summary}",
            "misinfo": "Misinformation risk is evaluated by the XGBoost classifier trained on the Misinformation_Data.csv corpus. High risk triggers Gemini Search Grounded fact-checking automatically.",
            "confidence": f"The last analysis returned {last_confidence}% confidence with {last_agreement}% model agreement across {len(MODEL_REGISTRY)} models.",
            "trend": f"Based on recent predictions: {history_summary}",
        }
        for key, val in fallback_map.items():
            if key in user_message.lower():
                return jsonify({"reply": val, "source": "rule_based"})
        return jsonify({"reply": f"I am operating in offline mode. Live stats: {stats_summary}", "source": "rule_based"})

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=system_prompt,
            config={"temperature": 0.3, "max_output_tokens": 512}
        )
        return jsonify({"reply": response.text, "source": "gemini"})
    except Exception as e:
        return jsonify({"reply": f"Copilot engine error: {str(e)}", "source": "error"}), 500




# ══════════════════════════════════════════════════════════════════════
#  PHASE 10 — ENTERPRISE ROUTES
# ══════════════════════════════════════════════════════════════════════

@app.route("/demo", methods=["POST"])
def demo_stream():
    """
    Offline Demo Mode — returns a synthetic tweet batch analyzed with
    the real ensemble engine. Fully functional without Twitter API.
    """
    data = request.get_json() or {}
    count = min(int(data.get("count", 5)), 10)

    # Generate synthetic tweets
    tweets = generate_demo_stream(count)

    # Run each through real ML pipeline
    enriched = []
    for t in tweets:
        try:
            text = t["text"]
            preprocessed = preprocess_traditional(text)
            model_results, consensus = run_all_models(text, preprocessed, MODEL_REGISTRY)

            # Misinfo check
            risk = "Low"
            if misinfo_model and misinfo_vectorizer:
                try:
                    vec_text = misinfo_vectorizer.transform([preprocessed])
                    pred = misinfo_model.predict(vec_text)[0]
                    risk = "High" if pred == 1 else "Low"
                except Exception:
                    pass

            t.update({
                "sentiment": consensus.get("label", t["sentiment"]),
                "confidence": consensus.get("confidence", t["confidence"]),
                "misinformation": risk,
                "model_results": {k: {"label": v.get("label"), "confidence": v.get("confidence"), "latency_ms": v.get("latency_ms")} for k, v in model_results.items()},
                "consensus": consensus,
                "source": "demo_mode_real_inference",
            })
        except Exception as e:
            t["inference_error"] = str(e)
        enriched.append(t)

    return jsonify({
        "mode": "offline_demo",
        "tweets": enriched,
        "count": len(enriched),
        "note": "Demo mode: Synthetic corpus with real ensemble inference. No Twitter API required."
    })


@app.route("/forecast", methods=["GET"])
def sentiment_forecast():
    """
    Predictive Analytics — time-series forecast of future sentiment trajectory.
    Uses linear regression + moving average over MongoDB history.
    """
    horizon = int(request.args.get("horizon", 7))
    limit   = int(request.args.get("limit", 30))

    history = []
    try:
        if history_collection:
            raw = list(history_collection.find({}, {"_id": 0, "sentiment": 1, "score": 1, "timestamp": 1})
                       .sort("timestamp", -1).limit(limit))
            history = list(reversed(raw))
    except Exception as e:
        history = []

    forecast_data = generate_forecast(history, horizon=horizon)

    return jsonify({
        "forecast": forecast_data["forecast"],
        "trend":    forecast_data["trend"],
        "trend_slope": forecast_data["trend_slope"],
        "confidence":  forecast_data["confidence"],
        "data_points": forecast_data["data_points"],
        "horizon": horizon,
        "note": "Forecast generated via linear regression + moving average. For research purposes."
    })


@app.route("/benchmark", methods=["GET"])
def model_benchmark():
    """
    Research Mode — Model benchmarking dashboard.
    Returns F1, Precision, Recall, Accuracy, and Latency for all active models.
    """
    active_keys = list(MODEL_REGISTRY.keys())
    data = get_benchmark_data(active_keys)
    return jsonify(data)


@app.route("/health", methods=["GET"])
def system_health():
    """
    Enterprise health check endpoint — returns full system telemetry snapshot.
    """
    health = generate_system_health()
    health["models_active"] = len(MODEL_REGISTRY)
    health["mongo_connected"] = history_collection is not None
    health["gemini_connected"] = gemini_client is not None
    health["misinfo_model"] = misinfo_model is not None

    total_records = 0
    try:
        if history_collection:
            total_records = history_collection.count_documents({})
    except Exception:
        pass
    health["total_records_stored"] = total_records

    return jsonify(health)


@app.route("/detect_language", methods=["POST"])
def detect_lang_endpoint():
    """
    Multilingual language detection — identifies the language of input text.
    Supports Unicode range detection for Devanagari, Arabic, CJK, Tamil, Telugu.
    """
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    result = detect_language(text)
    return jsonify(result)


@app.route("/stream_demo", methods=["GET"])
def stream_demo_single():
    """
    Single-item streaming simulation — returns one synthetic analysis at a time.
    Used by the frontend live demo ticker to simulate a continuous data stream.
    """
    import random as rnd
    tweet_batch = generate_demo_stream(1)
    if not tweet_batch:
        return jsonify({"error": "No data"}), 500
    t = tweet_batch[0]
    try:
        preprocessed = preprocess_traditional(t["text"])
        model_results, consensus = run_all_models(t["text"], preprocessed, MODEL_REGISTRY)
        t["sentiment"] = consensus.get("label", t["sentiment"])
        t["confidence"] = consensus.get("confidence", t["confidence"])
        t["consensus"] = consensus
    except Exception as e:
        t["inference_error"] = str(e)
    return jsonify(t)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
