"""
neural_nets.py — Deep Learning Models for NeuroPulse (PyTorch)

Provides LSTM and CNN text classifiers using PyTorch.
Includes training, saving, loading, and inference functions.

Architecture:
  - Shared tokenizer (vocab built from Tweets.csv, saved as .pkl)
  - BiLSTM: Embedding → BiLSTM(64) → Linear(32) → Softmax(3)
  - CNN:    Embedding → Conv1d(128, k=5) → AdaptiveMaxPool → Linear(64) → Softmax(3)
"""

import os
import re
import pickle
import numpy as np
import torch
import torch.nn as nn
from collections import Counter

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("wordnet", quiet=True)

_lemmatizer = WordNetLemmatizer()
_negation_words = {"not", "no", "never", "nor", "none", "n't"}
_stop_words = set(stopwords.words("english")) - _negation_words

VOCAB_SIZE = 20000
MAX_SEQ_LEN = 100
EMBED_DIM = 64
NUM_CLASSES = 3
SENTIMENT_MAP = {0: "negative", 1: "neutral", 2: "positive"}

# ── Paths ──
TOKENIZER_PATH = "models/neural_tokenizer.pkl"
LSTM_WEIGHTS_PATH = "models/lstm_model.pt"
CNN_WEIGHTS_PATH = "models/cnn_model.pt"


def _clean_text(text: str) -> str:
    """Light cleaning for neural net input."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"[^a-z0-9!?\s]", " ", text)
    tokens = word_tokenize(text)
    cleaned = [_lemmatizer.lemmatize(t) for t in tokens if t not in _stop_words]
    return " ".join(cleaned)


# ══════════════════════════════════════════════════════════════════════
#  Simple Tokenizer (word → index mapping)
# ══════════════════════════════════════════════════════════════════════

class SimpleTokenizer:
    """A minimal tokenizer that maps words to integer indices."""

    def __init__(self, vocab_size=VOCAB_SIZE):
        self.vocab_size = vocab_size
        self.word2idx = {"<PAD>": 0, "<OOV>": 1}
        self.idx2word = {0: "<PAD>", 1: "<OOV>"}

    def fit(self, texts):
        counter = Counter()
        for t in texts:
            counter.update(t.split())
        most_common = counter.most_common(self.vocab_size - 2)  # reserve PAD, OOV
        for idx, (word, _) in enumerate(most_common, start=2):
            self.word2idx[word] = idx
            self.idx2word[idx] = word

    def encode(self, text, max_len=MAX_SEQ_LEN):
        tokens = text.split()
        ids = [self.word2idx.get(w, 1) for w in tokens[:max_len]]
        # Pad
        ids = ids + [0] * (max_len - len(ids))
        return ids


# ══════════════════════════════════════════════════════════════════════
#  PyTorch Models
# ══════════════════════════════════════════════════════════════════════

class BiLSTMClassifier(nn.Module):
    def __init__(self, vocab_size=VOCAB_SIZE, embed_dim=EMBED_DIM, hidden_dim=64, num_classes=NUM_CLASSES):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True, dropout=0.3)
        self.fc1 = nn.Linear(hidden_dim * 2, 32)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(32, num_classes)

    def forward(self, x):
        emb = self.embedding(x)
        _, (hidden, _) = self.lstm(emb)
        # Concatenate forward and backward hidden states
        hidden = torch.cat((hidden[-2], hidden[-1]), dim=1)
        out = self.dropout(self.relu(self.fc1(hidden)))
        return self.fc2(out)


class CNNClassifier(nn.Module):
    def __init__(self, vocab_size=VOCAB_SIZE, embed_dim=EMBED_DIM, num_classes=NUM_CLASSES):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.conv = nn.Conv1d(embed_dim, 128, kernel_size=5)
        self.pool = nn.AdaptiveMaxPool1d(1)
        self.fc1 = nn.Linear(128, 64)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(64, num_classes)

    def forward(self, x):
        emb = self.embedding(x)  # (B, seq, embed)
        emb = emb.permute(0, 2, 1)  # (B, embed, seq) for Conv1d
        conv_out = self.relu(self.conv(emb))
        pooled = self.pool(conv_out).squeeze(-1)
        out = self.dropout(self.relu(self.fc1(pooled)))
        return self.fc2(out)


# ══════════════════════════════════════════════════════════════════════
#  Training
# ══════════════════════════════════════════════════════════════════════

def train_neural_models(csv_path="Tweets.csv", epochs=5, batch_size=64):
    """
    Train both BiLSTM and CNN on Tweets.csv and save weights + tokenizer.
    """
    import pandas as pd
    from sklearn.model_selection import train_test_split
    from torch.utils.data import TensorDataset, DataLoader

    print("\n" + "=" * 60)
    print("  NeuroPulse Neural Network Training (PyTorch)")
    print("=" * 60)

    # Load and preprocess
    print("\n[*] Loading dataset...")
    df = pd.read_csv(csv_path).dropna(subset=["text", "sentiment"])
    label_map = {"negative": 0, "neutral": 1, "positive": 2}
    df["label"] = df["sentiment"].str.lower().str.strip().map(label_map)
    df = df.dropna(subset=["label"])

    print(f"    Samples: {len(df)}")

    print("[*] Cleaning text...")
    df["clean_text"] = df["text"].apply(_clean_text)

    # Build tokenizer
    print("[*] Fitting tokenizer...")
    tokenizer = SimpleTokenizer(vocab_size=VOCAB_SIZE)
    tokenizer.fit(df["clean_text"].values)

    # Encode all texts
    encoded = [tokenizer.encode(t) for t in df["clean_text"].values]
    X = np.array(encoded, dtype=np.int64)
    y = df["label"].astype(int).values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Convert to PyTorch
    train_ds = TensorDataset(torch.tensor(X_train), torch.tensor(y_train, dtype=torch.long))
    test_ds = TensorDataset(torch.tensor(X_test), torch.tensor(y_test, dtype=torch.long))
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=batch_size)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    os.makedirs("models", exist_ok=True)

    # Save tokenizer
    with open(TOKENIZER_PATH, "wb") as f:
        pickle.dump(tokenizer, f)
    print(f"    Tokenizer saved -> {TOKENIZER_PATH}")

    def _train_one(model_class, name, save_path):
        print(f"\n{'='*60}")
        print(f"  Training: {name}")
        print(f"{'='*60}")

        model = model_class().to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
        criterion = nn.CrossEntropyLoss()

        for epoch in range(epochs):
            model.train()
            total_loss, correct, total = 0, 0, 0
            for xb, yb in train_loader:
                xb, yb = xb.to(device), yb.to(device)
                optimizer.zero_grad()
                logits = model(xb)
                loss = criterion(logits, yb)
                loss.backward()
                optimizer.step()
                total_loss += loss.item() * xb.size(0)
                correct += (logits.argmax(1) == yb).sum().item()
                total += xb.size(0)
            train_acc = correct / total
            print(f"  Epoch {epoch+1}/{epochs}  loss={total_loss/total:.4f}  train_acc={train_acc:.4f}")

        # Evaluate
        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for xb, yb in test_loader:
                xb, yb = xb.to(device), yb.to(device)
                preds = model(xb).argmax(1)
                correct += (preds == yb).sum().item()
                total += xb.size(0)
        test_acc = correct / total
        print(f"  Test Accuracy: {test_acc:.4f}")

        torch.save(model.state_dict(), save_path)
        print(f"  Weights saved -> {save_path}")
        return test_acc

    lstm_acc = _train_one(BiLSTMClassifier, "BiLSTM", LSTM_WEIGHTS_PATH)
    cnn_acc = _train_one(CNNClassifier, "1D-CNN", CNN_WEIGHTS_PATH)

    print(f"\n[DONE] LSTM: {lstm_acc:.4f}  |  CNN: {cnn_acc:.4f}")
    print("=" * 60)


# ══════════════════════════════════════════════════════════════════════
#  Loading
# ══════════════════════════════════════════════════════════════════════

def load_neural_models():
    """
    Load pre-trained LSTM and CNN models + tokenizer from disk.

    Returns:
        dict: { "lstm": (model, tokenizer), "cnn": (model, tokenizer) }
    """
    loaded = {}

    if not os.path.exists(TOKENIZER_PATH):
        print(f"  [x] Neural tokenizer not found: {TOKENIZER_PATH}")
        return loaded

    # Custom unpickler to handle __main__ → neural_nets class remapping
    import importlib
    class _NeuralUnpickler(pickle.Unpickler):
        def find_class(self, module, name):
            if name == "SimpleTokenizer":
                return SimpleTokenizer
            return super().find_class(module, name)

    with open(TOKENIZER_PATH, "rb") as f:
        tokenizer = _NeuralUnpickler(f).load()

    device = "cuda" if torch.cuda.is_available() else "cpu"

    if os.path.exists(LSTM_WEIGHTS_PATH):
        try:
            lstm = BiLSTMClassifier()
            lstm.load_state_dict(torch.load(LSTM_WEIGHTS_PATH, map_location=device, weights_only=True))
            lstm.to(device).eval()
            loaded["lstm"] = (lstm, tokenizer)
            print(f"  [ok] BiLSTM loaded from {LSTM_WEIGHTS_PATH}")
        except Exception as e:
            print(f"  [x] LSTM load error: {e}")
    else:
        print(f"  [x] LSTM weights not found: {LSTM_WEIGHTS_PATH}")

    if os.path.exists(CNN_WEIGHTS_PATH):
        try:
            cnn = CNNClassifier()
            cnn.load_state_dict(torch.load(CNN_WEIGHTS_PATH, map_location=device, weights_only=True))
            cnn.to(device).eval()
            loaded["cnn"] = (cnn, tokenizer)
            print(f"  [ok] 1D-CNN loaded from {CNN_WEIGHTS_PATH}")
        except Exception as e:
            print(f"  [x] CNN load error: {e}")
    else:
        print(f"  [x] CNN weights not found: {CNN_WEIGHTS_PATH}")

    return loaded


# ══════════════════════════════════════════════════════════════════════
#  Inference
# ══════════════════════════════════════════════════════════════════════

def predict_neural(text: str, model, tokenizer) -> dict:
    """
    Run inference on a single text through a PyTorch neural model.

    Args:
        text: Raw input string.
        model: A PyTorch model (BiLSTM or CNN).
        tokenizer: The SimpleTokenizer used during training.

    Returns:
        dict: { "label": str, "confidence": float }
    """
    cleaned = _clean_text(text)
    ids = tokenizer.encode(cleaned)
    tensor = torch.tensor([ids], dtype=torch.long)

    device = next(model.parameters()).device
    tensor = tensor.to(device)

    model.eval()
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.nn.functional.softmax(logits, dim=-1)[0]

    pred_id = int(torch.argmax(probs).item())
    confidence = round(float(probs[pred_id].item()) * 100, 2)
    label = SENTIMENT_MAP.get(pred_id, "unknown")

    return {"label": label, "confidence": confidence}


# ── CLI Entry Point ─────────────────────────────────────────────
if __name__ == "__main__":
    train_neural_models(csv_path="Tweets.csv", epochs=5, batch_size=64)
