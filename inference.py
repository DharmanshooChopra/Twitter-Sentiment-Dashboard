"""
inference.py — Parallel Multi-Model Inference Engine for NeuroPulse

Runs ALL loaded models (Classic ML, Deep Learning, Transformers) in parallel
using concurrent.futures.ThreadPoolExecutor. Returns timing data per model.
"""

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np

SENTIMENT_MAP = {0: "negative", 1: "neutral", 2: "positive"}

# Timeout per model (seconds) — increased to handle cold-start transformer warmup
MODEL_TIMEOUT = 60


def _predict_traditional(text: str, model, vectorizer):
    """Run prediction through a scikit-learn / XGBoost model."""
    from preprocessor import preprocess_traditional
    cleaned = preprocess_traditional(text)
    vec = vectorizer.transform([cleaned])
    pred_id = int(model.predict(vec)[0])
    label = SENTIMENT_MAP.get(pred_id, "unknown")

    try:
        proba = model.predict_proba(vec)[0]
        confidence = round(float(max(proba)) * 100, 2)
    except AttributeError:
        confidence = round(100.0 / len(SENTIMENT_MAP), 2)

    return {"label": label, "confidence": confidence}


def _predict_transformer(text: str, model, tokenizer, device="cpu"):
    """Run prediction through a HuggingFace Transformer model."""
    import torch
    from preprocessor import preprocess_transformer
    encoded = preprocess_transformer(text, tokenizer, max_length=128)
    encoded = {k: v.to(device) for k, v in encoded.items()}

    model.eval()
    with torch.no_grad():
        outputs = model(**encoded)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=-1)[0]

    pred_id = int(torch.argmax(probs).item())
    confidence = round(float(probs[pred_id].item()) * 100, 2)
    label = SENTIMENT_MAP.get(pred_id, "unknown")

    return {"label": label, "confidence": confidence}


def _predict_neural(text: str, model, tokenizer):
    """Run prediction through a Keras LSTM/CNN model."""
    from neural_nets import predict_neural
    return predict_neural(text, model, tokenizer)


def _run_single_model(name, entry, text):
    """
    Execute a single model prediction. Called inside a thread.
    Returns (name, result_dict).
    """
    start = time.time()
    try:
        model_type = entry["type"]
        
        if model_type == "traditional":
            pred = _predict_traditional(text, entry["model"], entry["vectorizer"])
        elif model_type == "transformer":
            pred = _predict_transformer(
                text, entry["model"], entry["tokenizer"],
                device=entry.get("device", "cpu")
            )
        elif model_type == "neural":
            pred = _predict_neural(text, entry["model"], entry["tokenizer"])
        else:
            return name, {
                "display_name": entry.get("display_name", name),
                "label": "error",
                "confidence": 0.0,
                "error": f"Unknown model type: {model_type}",
                "latency_ms": 0,
            }

        elapsed = round((time.time() - start) * 1000, 1)  # ms
        return name, {
            "display_name": entry.get("display_name", name),
            "label": pred["label"],
            "confidence": pred["confidence"],
            "latency_ms": elapsed,
        }

    except Exception as e:
        elapsed = round((time.time() - start) * 1000, 1)
        return name, {
            "display_name": entry.get("display_name", name),
            "label": "error",
            "confidence": 0.0,
            "error": str(e),
            "latency_ms": elapsed,
        }


def run_all_models(text: str, registry: dict) -> dict:
    """
    Run every loaded model against the input text IN PARALLEL.

    Uses ThreadPoolExecutor to dispatch all models simultaneously.
    Each model has a timeout of MODEL_TIMEOUT seconds.

    Args:
        text: Raw user input string.
        registry: The global MODEL_REGISTRY dict.

    Returns:
        dict of model results with timing data:
        {
            "model_name": {
                "display_name": str,
                "label": str,
                "confidence": float,
                "latency_ms": float
            }, ...
        }
    """
    if not registry:
        return {}

    results = {}
    
    # Use ThreadPoolExecutor for parallel inference across all models
    with ThreadPoolExecutor(max_workers=len(registry)) as executor:
        futures = {
            executor.submit(_run_single_model, name, entry, text): name
            for name, entry in registry.items()
        }
        
        for future in as_completed(futures, timeout=MODEL_TIMEOUT):
            model_name = futures[future]
            try:
                name, result = future.result(timeout=MODEL_TIMEOUT)
                results[name] = result
            except Exception as e:
                results[model_name] = {
                    "display_name": registry[model_name].get("display_name", model_name),
                    "label": "error",
                    "confidence": 0.0,
                    "error": f"Timeout/Exception: {str(e)}",
                    "latency_ms": MODEL_TIMEOUT * 1000,
                }

    return results


def compute_consensus(model_results: dict) -> dict:
    """
    Derive an ensemble consensus from all model predictions.

    Uses weighted voting — each model's vote is scaled by its confidence.

    Returns:
        { "label": str, "confidence": float, "agreement_pct": float, "total_models": int }
    """
    if not model_results:
        return {"label": "unknown", "confidence": 0.0, "agreement_pct": 0.0, "total_models": 0}

    # Weighted vote accumulator
    vote_weights = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
    valid_models = 0

    for entry in model_results.values():
        lbl = entry.get("label", "")
        conf = entry.get("confidence", 0.0)
        if lbl in vote_weights:
            vote_weights[lbl] += conf
            valid_models += 1

    if valid_models == 0:
        return {"label": "unknown", "confidence": 0.0, "agreement_pct": 0.0, "total_models": 0}

    consensus_label = max(vote_weights, key=vote_weights.get)
    consensus_confidence = round(vote_weights[consensus_label] / valid_models, 2)

    agreeing = sum(
        1 for e in model_results.values() if e.get("label") == consensus_label
    )
    agreement_pct = round((agreeing / valid_models) * 100, 1)

    return {
        "label": consensus_label,
        "confidence": consensus_confidence,
        "agreement_pct": agreement_pct,
        "total_models": valid_models,
    }
