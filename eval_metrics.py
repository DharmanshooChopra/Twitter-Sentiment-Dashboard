import pandas as pd
import pickle
import time
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from train_sentiment import preprocess_text as prep_sentiment
from train_misinformation import preprocess_text as prep_misinfo
import warnings
warnings.filterwarnings('ignore')

def main():
    print("Evaluating Misinformation Model (XGBoost)...")
    df_mis = pd.read_csv("Misinformation_Data.csv")
    label_map_mis = {"Low": 0, "High": 1}
    df_mis["label"] = df_mis["misinformation_risk"].map(label_map_mis)

    X_mis = df_mis["text"].apply(prep_misinfo)
    y_mis = df_mis["label"]
    _, X_test_mis, _, y_test_mis = train_test_split(X_mis, y_mis, test_size=0.2, random_state=42, stratify=y_mis)

    with open("models/misinfo_vectorizer.pkl", "rb") as f:
        vec_mis = pickle.load(f)
    with open("models/xgb_misinfo_model.pkl", "rb") as f:
        xgb_mis = pickle.load(f)

    X_test_mis_vec = vec_mis.transform(X_test_mis)
    preds_mis = xgb_mis.predict(X_test_mis_vec)

    print(f"  Accuracy:  {accuracy_score(y_test_mis, preds_mis)*100:.2f}%")
    print(f"  Precision: {precision_score(y_test_mis, preds_mis)*100:.2f}%")
    print(f"  Recall:    {recall_score(y_test_mis, preds_mis)*100:.2f}%")
    print(f"  F1-Score:  {f1_score(y_test_mis, preds_mis)*100:.2f}%")

    print("\nEvaluating Sentiment Model (SVM)...")
    df_sent = pd.read_csv("Tweets.csv").dropna(subset=["text", "sentiment"])
    sentiment_map = {"negative": 0, "neutral": 1, "positive": 2}
    df_sent["label"] = df_sent["sentiment"].str.lower().str.strip().map(sentiment_map)
    df_sent = df_sent.dropna(subset=["label"])

    X_sent = df_sent["text"].apply(prep_sentiment)
    y_sent = df_sent["label"].astype(int).values
    _, X_test_sent, _, y_test_sent = train_test_split(X_sent, y_sent, test_size=0.2, random_state=42, stratify=y_sent)

    with open("models/tfidf_vectorizer.pkl", "rb") as f:
        vec_sent = pickle.load(f)
    with open("models/svm_model.pkl", "rb") as f:
        svm_sent = pickle.load(f)

    X_test_sent_vec = vec_sent.transform(X_test_sent)
    preds_sent = svm_sent.predict(X_test_sent_vec)

    print(f"  Accuracy:  {accuracy_score(y_test_sent, preds_sent)*100:.2f}%")
    print(f"  Precision: {precision_score(y_test_sent, preds_sent, average='weighted')*100:.2f}%")
    print(f"  Recall:    {recall_score(y_test_sent, preds_sent, average='weighted')*100:.2f}%")
    print(f"  F1-Score:  {f1_score(y_test_sent, preds_sent, average='weighted')*100:.2f}%")

if __name__ == "__main__":
    main()
