import re
import os
import pickle
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
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

# Ensure NLTK resources
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
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

def main():
    print("Loading data...")
    df = pd.read_csv("Tweets.csv").dropna(subset=["text", "sentiment"])
    
    sentiment_map = {"negative": 0, "neutral": 1, "positive": 2}
    df["label"] = df["sentiment"].str.lower().str.strip().map(sentiment_map)
    df = df.dropna(subset=["label"])
    
    print("Preprocessing text...")
    df["clean_text"] = df["text"].apply(preprocess_text)
    
    X = df["clean_text"].values
    y = df["label"].astype(int).values
    
    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("Vectorizing Text...")
    vectorizer = TfidfVectorizer(
        max_features=30000,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.9,
        sublinear_tf=True
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    cv_strategy = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    
    print("Tuning Logistic Regression...")
    lr = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)
    lr_grid = GridSearchCV(lr, {"C": [0.5, 1.0, 2.0]}, cv=cv_strategy, scoring="accuracy", n_jobs=-1)
    lr_grid.fit(X_train_vec, y_train)
    best_lr = lr_grid.best_estimator_
    
    print("Tuning SVM with Probabilities...")
    svm = SVC(kernel='linear', probability=True, class_weight="balanced", random_state=42)
    svm_grid = GridSearchCV(svm, {"C": [0.5, 1.0, 2.0]}, cv=cv_strategy, scoring="accuracy", n_jobs=-1)
    svm_grid.fit(X_train_vec, y_train)
    best_svm = svm_grid.best_estimator_
    
    print("\nSaving Models...")
    Path("models").mkdir(exist_ok=True)
    with open("models/tfidf_vectorizer.pkl", "wb") as f: pickle.dump(vectorizer, f)
    with open("models/logreg_model.pkl", "wb") as f: pickle.dump(best_lr, f)
    with open("models/svm_model.pkl", "wb") as f: pickle.dump(best_svm, f)
    
    print("Done! Artifacts saved to 'models/' directory.")

if __name__ == "__main__":
    main()
