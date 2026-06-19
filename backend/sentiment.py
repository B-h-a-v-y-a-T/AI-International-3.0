from transformers import pipeline
import torch

# Load sentiment model (distilbert-base-uncased-finetuned-sst-2-english)
model_name = "distilbert-base-uncased-finetuned-sst-2-english"

# Use top_k=None to get ALL class probabilities (not just the argmax)
sentiment_analyzer = pipeline("sentiment-analysis", model=model_name, top_k=None)


def analyze_sentiment(text):
    """
    Analyzes the sentiment of a given text with FULL probability output.

    Returns:
        dict with:
            - label: str ('POSITIVE' or 'NEGATIVE')
            - score: float (confidence of predicted label)
            - probabilities: dict with all class probabilities
            - confidence: float (max probability)
            - top_gap: float (difference between top-1 and top-2 probabilities)
    """
    # top_k=None returns all class scores with softmax probabilities
    results = sentiment_analyzer(text)[0]

    # Build probability dictionary: {'POSITIVE': 0.95, 'NEGATIVE': 0.05}
    probabilities = {item['label']: float(item['score']) for item in results}

    # Sort by score descending to get top-1 and top-2
    sorted_probs = sorted(results, key=lambda x: x['score'], reverse=True)
    predicted_label = sorted_probs[0]['label']
    confidence = float(sorted_probs[0]['score'])

    # Compute top-2 gap (uncertainty measure)
    if len(sorted_probs) >= 2:
        top_gap = confidence - float(sorted_probs[1]['score'])
    else:
        top_gap = confidence  # Only one class (shouldn't happen)

    return {
        "label": predicted_label,       # 'POSITIVE' or 'NEGATIVE'
        "score": confidence,            # backward compatible (same as before)
        "probabilities": probabilities, # NEW: full probability distribution
        "confidence": confidence,       # NEW: explicit confidence
        "top_gap": top_gap              # NEW: uncertainty measure
    }


# Test block when running sentiment.py directly
if __name__ == "__main__":
    tests = [
        "I am really frustrated with this question",
        "hi",
        "ok",
        "This is amazing!",
        "I feel very stressed about exams",
        "hello there",
    ]
    for t in tests:
        output = analyze_sentiment(t)
        print(f"  '{t}' → {output['label']} (conf={output['confidence']:.3f}, gap={output['top_gap']:.3f})")