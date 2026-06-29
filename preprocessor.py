"""
preprocessor.py — Unified Preprocessing for NeuroPulse Multi-Model Engine

Handles two distinct pipelines:
  1. Traditional NLP (SVM, LogReg, RF, XGBoost) → lemmatization + TF-IDF vectors
  2. Transformer NLP (BERT, RoBERTa) → HuggingFace tokenizer encoding
"""

import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

import os

# Ensure NLTK data is available with serverless-safe downloads
if os.getenv("VERCEL"):
    _nltk_dir = "/tmp/nltk_data"
    if _nltk_dir not in nltk.data.path:
        nltk.data.path.append(_nltk_dir)
    os.makedirs(_nltk_dir, exist_ok=True)
else:
    _nltk_dir = None

try:
    nltk.download("stopwords", download_dir=_nltk_dir, quiet=True)
    nltk.download("punkt", download_dir=_nltk_dir, quiet=True)
    nltk.download("punkt_tab", download_dir=_nltk_dir, quiet=True)
    nltk.download("wordnet", download_dir=_nltk_dir, quiet=True)
except Exception:
    pass

_lemmatizer = WordNetLemmatizer()
_negation_words = {"not", "no", "never", "nor", "none", "n't"}
_stop_words = set(stopwords.words("english")) - _negation_words


def preprocess_traditional(text: str) -> str:
    """
    Clean and lemmatize text for traditional ML models.
    
    Pipeline: lowercase → strip URLs → strip @mentions → 
              remove special chars → tokenize → remove stopwords → lemmatize
    
    Returns:
        Cleaned string ready for TF-IDF vectorization.
    """
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"[^a-z0-9!?\s]", " ", text)
    tokens = word_tokenize(text)
    cleaned = [_lemmatizer.lemmatize(t) for t in tokens if t not in _stop_words]
    return " ".join(cleaned)


def preprocess_transformer(text: str, tokenizer, max_length: int = 128):
    """
    Tokenize raw text for Transformer models (BERT, RoBERTa, etc.)
    
    Applies light cleaning (URL/mention removal) but preserves casing and
    punctuation since Transformer tokenizers handle those internally.
    
    Args:
        text: Raw input string.
        tokenizer: A HuggingFace AutoTokenizer instance.
        max_length: Max token sequence length (default 128).
    
    Returns:
        Dict with 'input_ids', 'attention_mask' tensors ready for model.forward().
    """
    if not isinstance(text, str):
        text = ""
    # Light cleaning only — keep casing + punctuation for subword tokenizers
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = text.strip()

    encoded = tokenizer(
        text,
        max_length=max_length,
        padding="max_length",
        truncation=True,
        return_tensors="pt"
    )
    return encoded
