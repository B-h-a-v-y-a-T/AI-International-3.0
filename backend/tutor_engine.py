from typing import Dict, Any, Optional
from tutor_mood import detect_mood, detect_mood_detailed
from tutor_concepts import find_weak_concepts
from sentiment import analyze_sentiment
from bandit import (
    select_action, compute_reward, update_q_value, get_action_details,
    select_variation, update_variation_q
)
from intent_detector import detect_intent
from decision_engine import decide_action, get_variation_pool

# Background modules (silent operation)
try:
    import database as db
    import feedback_loop as fl
    import risk_detection as rd
    DB_ENABLED = True
except Exception as e:
    DB_ENABLED = False
    print(f"Database modules not loaded: {e}")

def tutor_engine(
    message: str, 
    performance: Dict[str, float],
    previous_performance: Optional[Dict[str, float]] = None,
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Main orchestration function — upgraded intelligence pipeline.
    
    Flow: input → sentiment → intent → decision engine → bandit(variation) → Gemini → response
    
    Original bandit learning (Q-values, rewards) is preserved for backward compatibility.
    """
    if previous_performance is None:
        previous_performance = performance
        
    # ═══════════════════════════════════════════════════════════════════════
    # STAGE 1: ANALYZE — Understand the student
    # ═══════════════════════════════════════════════════════════════════════
    
    # 1a. Detect mood (full pipeline: short-text, greeting, confidence, uncertainty)
    mood_detail = detect_mood_detailed(message, performance)
    mood = mood_detail["mood"]
    
    # 1b. Raw sentiment (for reward computation — unchanged)
    sentiment = analyze_sentiment(message)
    risk_score = sentiment['score'] if sentiment['label'] == 'NEGATIVE' else 0.0
    
    # 1c. Detect intent (NEW)
    intent = detect_intent(message)
    
    # 1d. Build weak concept map
    try:
        weak_concepts = find_weak_concepts(performance)
        target_concept = weak_concepts[-1] if weak_concepts else "the current topic"
    except Exception:
        weak_concepts = []
        target_concept = "the current topic"
    
    # ═══════════════════════════════════════════════════════════════════════
    # STAGE 2: DECIDE — Choose the right action
    # ═══════════════════════════════════════════════════════════════════════
    
    # 2a. Decision engine maps (mood, intent) → high-level action
    decision_result = decide_action(mood, intent)
    decided_action = decision_result["action"]
    allow_videos = decision_result["allow_videos"]
    
    # 2b. Bandit selects a VARIATION within the decided action
    variation_pool = get_variation_pool(decided_action)
    variation = select_variation(variation_pool)
    
    # ═══════════════════════════════════════════════════════════════════════
    # STAGE 3: LEARN — Original bandit learning (PRESERVED)
    # ═══════════════════════════════════════════════════════════════════════
    
    # 3a. Original bandit action selection (still runs for Q-value learning)
    bandit_action = select_action()
    
    # 3b. Compute reward (UNCHANGED — uses performance delta - risk score)
    reward = compute_reward(performance, previous_performance, risk_score)
    
    # 3c. Update original Q-values (UNCHANGED)
    update_q_value(bandit_action, reward)
    
    # 3d. Update variation Q-values (NEW — learns which styles work best)
    update_variation_q(variation, reward)
    
    # 3e. Get original action details for backward compatibility
    bandit_decision = get_action_details(bandit_action, weak_concepts)
    
    # ═══════════════════════════════════════════════════════════════════════
    # STAGE 4: RESPOND — Generate intelligent response via Gemini
    # ═══════════════════════════════════════════════════════════════════════
    
    explanation = bandit_decision["explanation"]
    mascot_message = bandit_decision["mascot_message"]
    
    try:
        from gemini_service import generate_explanation
        gemini_result = generate_explanation({
            "message": message,
            "mood": mood,
            "intent": intent,
            "decided_action": decided_action,
            "variation": variation,
            "target_concept": target_concept,
            "selected_action": bandit_action,  # backward compat
        })
        if gemini_result.get("explanation"):
            explanation = gemini_result["explanation"]
        if gemini_result.get("mascot_message"):
            mascot_message = gemini_result["mascot_message"]
    except Exception:
        pass  # Graceful fallback — original values stay
    
    # ═══════════════════════════════════════════════════════════════════════
    # STAGE 5: FORMAT — Compile response (backward compatible + new fields)
    # ═══════════════════════════════════════════════════════════════════════
    
    # ═══════════════════════════════════════════════════════════════════════
    # BACKGROUND TASKS (Silent - No impact on response)
    # ═══════════════════════════════════════════════════════════════════════
    
    if DB_ENABLED:
        try:
            # Log chat interaction
            db.log_chat(
                user_id, 
                message, 
                explanation, 
                sentiment.get('score', 0.0),
                mood,
                intent
            )
            
            # Update risk state (dropout detection)
            rd.update_risk_state_background(user_id)
            
            # Get adaptive strategy based on risk
            adaptive_tone = rd.get_adaptive_tone(user_id)
            
        except Exception as e:
            # Silent failure - don't break chatbot
            pass
    
    return {
        # Original fields (backward compatible)
        "mood": mood,
        "selected_action": bandit_action,
        "target_concept": target_concept,
        "reward": round(reward, 4),
        "weak_concepts": weak_concepts,
        "next_action": bandit_action,
        "difficulty": bandit_decision["difficulty"],
        "mascot_message": mascot_message,
        "explanation": explanation,
        # Intelligence layer fields
        "intent": intent,
        "decided_action": decided_action,
        "variation": variation,
        "allow_videos": allow_videos,
        "reasoning": decision_result["reasoning"],
        # Mood pipeline details
        "mood_confidence": mood_detail["confidence"],
        "mood_raw_label": mood_detail["raw_label"],
        "mood_reason": mood_detail["reason"],
    }