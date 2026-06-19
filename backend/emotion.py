from transformers import pipeline

# We use an emotion classification model from HuggingFace
# 'j-hartmann/emotion-english-distilroberta-base' is a popular one for 7 basic emotions
# We can map its outputs to frustration, confusion, and neutral.
model_name = "j-hartmann/emotion-english-distilroberta-base"
emotion_analyzer = pipeline("text-classification", model=model_name, top_k=None)

def analyze_emotion(text):
    """
    Analyzes the emotion of a given text.
    Returns scores for 'frustration', 'confusion', and 'neutral'.
    """
    # top_k=None returns all emotion scores
    result = emotion_analyzer(text)[0]
    
    # Pack result into an easily accessible dictionary { label: score }
    scores = {item['label']: item['score'] for item in result}
    
    # We heuristically map the model's standard emotions to our target concepts:
    # anger & disgust -> frustration
    # surprise & fear -> confusion
    # neutral -> neutral
    return {
        "frustration": float(scores.get("anger", 0) + scores.get("disgust", 0)),
        "confusion": float(scores.get("surprise", 0) + scores.get("fear", 0)),
        "neutral": float(scores.get("neutral", 0))
    }

if __name__ == "__main__":
    text = "I am really frustrated with this question"
    print("Test Output:", analyze_emotion(text))
