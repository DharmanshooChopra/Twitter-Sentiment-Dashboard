import re
import os
import pickle
import time
import pandas as pd
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

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
    text = re.sub(r"[^a-z0-9!?\s]", " ", text)
    tokens = word_tokenize(text)
    cleaned_tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words]
    return " ".join(cleaned_tokens)

def main():
    print("Loading Misinformation dataset...")
    df = pd.read_csv("Misinformation_Data.csv")
    
    print("Preprocessing text...")
    df['cleaned_text'] = df['text'].apply(preprocess_text)
    
    # Map back labels to integers for XGBoost
    label_map = {"Low": 0, "High": 1}
    df['label'] = df['misinformation_risk'].map(label_map)
    
    X = df['cleaned_text']
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Vectorizing...")
    vectorizer = TfidfVectorizer(max_features=10000, max_df=0.95, min_df=5, ngram_range=(1,2))
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    print("Training XGBoost Classifier for maximum accuracy...")
    xgb = XGBClassifier(eval_metric='logloss', use_label_encoder=False, random_state=42)
    xgb.fit(X_train_vec, y_train)
    
    y_pred = xgb.predict(X_test_vec)
    acc = accuracy_score(y_test, y_pred)
    print(f"XGBoost Accuracy: {acc*100:.2f}%")
    print(classification_report(y_test, y_pred, target_names=["Low Risk (Real)", "High Risk (Fake)"]))
    
    print("Saving models to models/ ...")
    os.makedirs("models", exist_ok=True)
    with open("models/misinfo_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
        
    with open("models/xgb_misinfo_model.pkl", "wb") as f:
        pickle.dump(xgb, f)
        
    print("Setup complete. Misinformation model successfully trained and weights saved.")

if __name__ == "__main__":
    main()
