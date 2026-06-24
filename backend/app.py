from flask import Flask, request, jsonify
from flask_cors import CORS
from sentiment import analyze_sentiment
from emotion import analyze_emotion
from datetime import datetime

app = Flask(__name__)
# Enable CORS so the frontend can communicate with the backend
CORS(app)

# Simple in-memory storage: list of dictionary records
history_storage = []
# Store user-specific data: risk score and short history
user_states = {}

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Expects JSON input: { "message": "text", "user_id": "optional_id" }
    Returns sentiment and emotion analysis results and updates risk status.
    """
    data = request.get_json()
    
    # Basic error handling
    if not data or 'message' not in data:
        return jsonify({"error": "Message is missing from request"}), 400
        
    message = data['message']
    user_id = data.get('user_id', 'default_user')
    
    # Initialize user state if not exists
    if user_id not in user_states:
        user_states[user_id] = {"history": [], "risk_score": 0, "reasons": []}
        
    try:
        # Perform analyses using the imported functions
        sentiment = analyze_sentiment(message)
        emotion = analyze_emotion(message)
        
        # --- RISK LOGIC ---
        current_risk = user_states[user_id]["risk_score"]
        
        # We start with a fresh list for logic, but will ultimately combine and deduplicate
        # to ensure explainability makes sense and is cumulative or fresh.
        current_reasons = [] 
        
        # 1. Sentiment Risk
        if sentiment['label'] == 'NEGATIVE':
            current_risk += 1
            current_reasons.append("Negative sentiment detected")
        else:
            # POSITIVE sentiment gradually decreases risk
            current_risk = max(0, current_risk - 1)
            
        # 2. Emotion Risk
        if emotion.get('frustration', 0) > 0.5:
            current_risk += 2
            current_reasons.append("High frustration detected")
            
        if emotion.get('confusion', 0) > 0.5:
            current_risk += 1
            current_reasons.append("User seems confused")
            
        # 3. Critical Phrases Risk
        lower_msg = message.lower()
        critical_phrases = ["i give up", "i can't do this", "i cant do this", "i quit", "what's the point"]
        for phrase in critical_phrases:
            if phrase in lower_msg:
                current_risk += 3
                current_reasons.append("Critical phrase detected")
                break # Only penalize once for critical phrases per message
                
        # 4. History Pattern Risk (Update rolling history of last 5 messages)
        user_states[user_id]["history"].append(sentiment['label'])
        user_states[user_id]["history"] = user_states[user_id]["history"][-5:]
        
        # Trend penalty: if 3 or more of last 5 messages are NEGATIVE
        neg_count = user_states[user_id]["history"].count('NEGATIVE')
        if neg_count >= 3:
            current_risk += 2
            current_reasons.append("Repeated negative pattern")
            
        # Cap risk score strictly between 0 and 10
        current_risk = max(0, min(10, current_risk))
        
        # Combine with existing reasons if risk > 0, otherwise clear
        if current_risk == 0:
            final_reasons = []
        else:
            # Combine preserving order and deduplicating
            all_reasons = user_states[user_id]["reasons"] + current_reasons
            # Remove duplicates while preserving order
            final_reasons = []
            for r in all_reasons:
                if r not in final_reasons:
                    final_reasons.append(r)
                    
        # Replace the user's state
        user_states[user_id]["risk_score"] = current_risk
        user_states[user_id]["reasons"] = final_reasons
        
        # Create storage record
        record = {
            "user_id": user_id,
            "message": message,
            "sentiment": sentiment,
            "emotion": emotion,
            "timestamp": datetime.now().isoformat()
        }
        history_storage.append(record)
        
        # Output result
        return jsonify({
            "status": "success",
            "sentiment": sentiment,
            "emotion": emotion,
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/history', methods=['GET'])
def history():
    """
    Returns all stored messages.
    """
    user_id = request.args.get('user_id')
    
    # Return all or filter by user
    if user_id:
        user_history = [record for record in history_storage if record['user_id'] == user_id]
    else:
        user_history = history_storage
        
    return jsonify({
        "status": "success",
        "total_messages": len(user_history),
        "history": user_history
    }), 200

@app.route('/risk', methods=['GET'])
def risk():
    """
    Returns the current risk score and risk level for a user, with explanations.
    """
    user_id = request.args.get('user_id', 'default_user')
    state = user_states.get(user_id, {"risk_score": 0, "reasons": []})
    
    current_risk = state["risk_score"]
    reasons = state["reasons"]
    
    # Determine level
    level = "LOW"
    if current_risk >= 3:
        level = "HIGH"
    elif current_risk >= 1:
        level = "MEDIUM"
        
    top_reason = "Normal conversation"
    if reasons:
        top_reason = reasons[-1] # Grab the most recent trigger reason as the top reason
        
    return jsonify({
        "user_id": user_id,
        "risk_score": current_risk,
        "level": level,
        "top_reason": top_reason,
        "reasons": reasons
    }), 200

# INSTRUCTIONS ON HOW TO RUN THE SERVER:
# 1. Open your terminal in the backend/ folder.
# 2. Make sure you are using your configured virtual environment.
# 3. Run the command:
#    python app.py
# 4. The server will start by default on http://localhost:5050

if __name__ == '__main__':
    # Keep it simple, beginner-friendly, and accessible
    app.run(host='0.0.0.0', port=5051, debug=True)
