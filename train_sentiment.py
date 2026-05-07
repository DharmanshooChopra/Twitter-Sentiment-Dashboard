"""
train_sentiment.py — NeuroPulse Multi-Model Training Pipeline

Trains all Classic ML models using the EXISTING tfidf_vectorizer.pkl:
  1. SVM (Linear)          — already trained, re-trains for consistency  
  2. Logistic Regression   — already trained, re-trains for consistency
  3. Random Forest         — NEW
  4. XGBoost               — NEW
  5. Multinomial Naive Bayes — NEW

All models are saved to the models/ directory as .pkl files.
"""

import re
import os
import pickle
import time
from pathlib import Path
import pandas as pd
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, f1_score, classification_report
from xgboost import XGBClassifier

# Ensure NLTK resources
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("wordnet", quiet=True)

lemmatizer = WordNetLemmatizer()
negation_words = {"not", "no", "never", "nor", "none", "n't"}
stop_words = set(stopwords.words("english")) - negation_words

def preprocess_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"[^a-z0-9!?\s]", " ", text)
    tokens = word_tokenize(text)
    cleaned_tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words]
    return " ".join(cleaned_tokens)


def train_model(name, model, X_train_vec, y_train, X_test_vec, y_test, param_grid=None, cv=None):
    """Train a single model with optional GridSearch, print report, return best estimator."""
    print(f"\n{'='*60}")
    print(f"  Training: {name}")
    print(f"{'='*60}")
    start = time.time()
    
    if param_grid and cv:
        grid = GridSearchCV(model, param_grid, cv=cv, scoring="accuracy", n_jobs=-1)
        grid.fit(X_train_vec, y_train)
        best = grid.best_estimator_
        print(f"  Best params: {grid.best_params_}")
    else:
        model.fit(X_train_vec, y_train)
        best = model
    
    elapsed = time.time() - start
    preds = best.predict(X_test_vec)
    acc = accuracy_score(y_test, preds)
    f1 = f1_score(y_test, preds, average="weighted")
    
    print(f"  Accuracy: {acc:.4f}  |  F1 (weighted): {f1:.4f}  |  Time: {elapsed:.1f}s")
    print(classification_report(y_test, preds, target_names=["negative", "neutral", "positive"]))
    
    return best


def main():
    print("=" * 60)
    print("  NeuroPulse Multi-Model Training Pipeline")
    print("=" * 60)
    
    # ── Load & Preprocess Data ──────────────────────────────────
    print("\n📂 Loading Tweets.csv...")
    df = pd.read_csv("Tweets.csv").dropna(subset=["text", "sentiment"])
    
    sentiment_map = {"negative": 0, "neutral": 1, "positive": 2}
    df["label"] = df["sentiment"].str.lower().str.strip().map(sentiment_map)
    df = df.dropna(subset=["label"])
    
    print(f"   Dataset size: {len(df)} samples")
    print(f"   Distribution: {dict(df['label'].value_counts().sort_index())}")
    
    print("\n🔧 Preprocessing text...")
    df["clean_text"] = df["text"].apply(preprocess_text)
    
    X = df["clean_text"].values
    y = df["label"].astype(int).values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # ── Vectorization ───────────────────────────────────────────
    # Check if existing vectorizer exists — reuse it for consistency
    vectorizer_path = "models/tfidf_vectorizer.pkl"
    if os.path.exists(vectorizer_path):
        print(f"\n📦 Loading existing vectorizer from {vectorizer_path}")
        with open(vectorizer_path, "rb") as f:
            vectorizer = pickle.load(f)
        X_train_vec = vectorizer.transform(X_train)
        X_test_vec = vectorizer.transform(X_test)
    else:
        print("\n🔧 Fitting new TF-IDF Vectorizer...")
        vectorizer = TfidfVectorizer(
            max_features=30000,
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.9,
            sublinear_tf=True
        )
        X_train_vec = vectorizer.fit_transform(X_train)
        X_test_vec = vectorizer.transform(X_test)
    
    Path("models").mkdir(exist_ok=True)
    
    cv_strategy = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    
    # ══════════════════════════════════════════════════════════════
    #  TRAIN ALL 5 CLASSIC ML MODELS
    # ══════════════════════════════════════════════════════════════
    
    # 1. Logistic Regression
    best_lr = train_model(
        "Logistic Regression",
        LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42),
        X_train_vec, y_train, X_test_vec, y_test,
        param_grid={"C": [0.5, 1.0, 2.0]},
        cv=cv_strategy
    )
    
    # 2. SVM (Linear)
    best_svm = train_model(
        "SVM (Linear Kernel)",
        SVC(kernel='linear', probability=True, class_weight="balanced", random_state=42),
        X_train_vec, y_train, X_test_vec, y_test,
        param_grid={"C": [0.5, 1.0, 2.0]},
        cv=cv_strategy
    )
    
    # 3. Random Forest — NEW
    best_rf = train_model(
        "Random Forest",
        RandomForestClassifier(class_weight="balanced", random_state=42, n_jobs=-1),
        X_train_vec, y_train, X_test_vec, y_test,
        param_grid={"n_estimators": [100, 200], "max_depth": [None, 30]},
        cv=cv_strategy
    )
    
    # 4. XGBoost — NEW  
    best_xgb = train_model(
        "XGBoost",
        XGBClassifier(
            objective="multi:softprob",
            num_class=3,
            eval_metric="mlogloss",
            use_label_encoder=False,
            random_state=42,
            n_jobs=-1
        ),
        X_train_vec, y_train, X_test_vec, y_test,
        param_grid={"n_estimators": [100, 200], "max_depth": [4, 6], "learning_rate": [0.1, 0.3]},
        cv=cv_strategy
    )
    
    # 5. Multinomial Naive Bayes — NEW
    best_nb = train_model(
        "Multinomial Naive Bayes",
        MultinomialNB(),
        X_train_vec, y_train, X_test_vec, y_test,
        param_grid={"alpha": [0.1, 0.5, 1.0]},
        cv=cv_strategy
    )
    
    # ══════════════════════════════════════════════════════════════
    #  SAVE ALL ARTIFACTS
    # ══════════════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("  💾 Saving Model Artifacts")
    print("=" * 60)
    
    # Save vectorizer (may have been loaded — save again for safety)
    with open("models/tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    print("  ✓ models/tfidf_vectorizer.pkl")
    
    artifacts = {
        "models/logreg_model.pkl": best_lr,
        "models/svm_model.pkl": best_svm,
        "models/rf_model.pkl": best_rf,
        "models/xgb_model.pkl": best_xgb,
        "models/nb_model.pkl": best_nb,
    }
    
    for path, model in artifacts.items():
        with open(path, "wb") as f:
            pickle.dump(model, f)
        size_kb = os.path.getsize(path) / 1024
        print(f"  ✓ {path}  ({size_kb:.0f} KB)")
    
    print(f"\n🎉 All {len(artifacts)} models + vectorizer saved to 'models/' directory.")
    print("=" * 60)


if __name__ == "__main__":
    main()
