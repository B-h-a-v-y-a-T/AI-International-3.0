"""
Dropout / Mental Risk Detection
Monitors chat interactions for emotional distress and engagement patterns.
Calculates internal risk score without alerting the user.
"""

from typing import Dict, List, Tuple
from datetime import datetime, timedelta
import database as db

# ═══════════════════════════════════════════════════════════════════════════════
# RISK FACTORS
# ═══════════════════════════════════════════════════════════════════════════════

NEGATIVE_EMOTIONS = ['frustrated', 'anxious', 'sad', 'tired', 'angry', 'confused']
CRITICAL_PHRASES = [
    'give up', 'quit', 'can\'t do this', 'too hard', 'impossible',
    'hate this', 'useless', 'pointless', 'done with', 'no point'
]

def calculate_sentiment_risk(user_id: str, lookback_days: int = 7) -> Tuple[float, List[str]]:
    """
    Calculate risk based on sentiment patterns in recent chats.
    Returns: (risk_score, risk_factors)
    """
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cutoff = datetime.now() - timedelta(days=lookback_days)
    cursor.execute('''
        SELECT sentiment_score, emotion, message
        FROM chat_logs
        WHERE user_id = ? AND timestamp > ?
        ORDER BY timestamp DESC
    ''', (user_id, cutoff))
    
    chats = cursor.fetchall()
    conn.close()
    
    if not chats:
        return 0.0, []
    
    risk_score = 0.0
    risk_factors = []
    
    # Analyze sentiment scores
    negative_count = sum(1 for chat in chats if chat['sentiment_score'] < -2)
    if negative_count > len(chats) * 0.5:
        risk_score += 2.0
        risk_factors.append('Persistent negative sentiment')
    
    # Analyze emotions
    negative_emotion_count = sum(1 for chat in chats if chat['emotion'] in NEGATIVE_EMOTIONS)
    if negative_emotion_count > len(chats) * 0.6:
        risk_score += 1.5
        risk_factors.append('High negative emotion frequency')
    
    # Check for critical phrases
    for chat in chats:
        message_lower = chat['message'].lower()
        if any(phrase in message_lower for phrase in CRITICAL_PHRASES):
            risk_score += 3.0
            risk_factors.append('Critical distress phrases detected')
            break
    
    return min(risk_score, 10.0), risk_factors

def calculate_engagement_risk(user_id: str, lookback_days: int = 7) -> Tuple[float, List[str]]:
    """
    Calculate risk based on engagement patterns.
    Returns: (risk_score, risk_factors)
    """
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cutoff = datetime.now() - timedelta(days=lookback_days)
    
    # Count chat interactions
    cursor.execute('''
        SELECT COUNT(*) as count
        FROM chat_logs
        WHERE user_id = ? AND timestamp > ?
    ''', (user_id, cutoff))
    chat_count = cursor.fetchone()['count']
    
    # Count quiz attempts
    cursor.execute('''
        SELECT COUNT(DISTINCT quiz_id) as count
        FROM quiz_results
        WHERE user_id = ? AND timestamp > ?
    ''', (user_id, cutoff))
    quiz_count = cursor.fetchone()['count']
    
    conn.close()
    
    risk_score = 0.0
    risk_factors = []
    
    # Low engagement detection
    if chat_count < 3 and lookback_days >= 7:
        risk_score += 1.5
        risk_factors.append('Low chat engagement')
    
    if quiz_count == 0 and lookback_days >= 7:
        risk_score += 2.0
        risk_factors.append('No quiz attempts')
    
    return risk_score, risk_factors

def calculate_performance_risk(user_id: str) -> Tuple[float, List[str]]:
    """
    Calculate risk based on declining performance.
    Returns: (risk_score, risk_factors)
    """
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Get recent quiz results
    cursor.execute('''
        SELECT is_correct, timestamp
        FROM quiz_results
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 20
    ''', (user_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    if len(results) < 5:
        return 0.0, []
    
    risk_score = 0.0
    risk_factors = []
    
    # Calculate recent accuracy
    recent_correct = sum(1 for r in results[:10] if r['is_correct'])
    recent_accuracy = recent_correct / min(10, len(results))
    
    if recent_accuracy < 0.3:
        risk_score += 2.5
        risk_factors.append('Very low quiz accuracy')
    elif recent_accuracy < 0.5:
        risk_score += 1.5
        risk_factors.append('Low quiz accuracy')
    
    # Check for declining trend
    if len(results) >= 10:
        first_half = sum(1 for r in results[:5] if r['is_correct']) / 5
        second_half = sum(1 for r in results[5:10] if r['is_correct']) / 5
        
        if first_half - second_half > 0.3:
            risk_score += 1.5
            risk_factors.append('Declining performance trend')
    
    return risk_score, risk_factors

# ═══════════════════════════════════════════════════════════════════════════════
# COMBINED RISK ASSESSMENT
# ═══════════════════════════════════════════════════════════════════════════════

def assess_dropout_risk(user_id: str) -> Dict:
    """
    Comprehensive dropout risk assessment.
    Returns risk score, level, and factors.
    """
    sentiment_risk, sentiment_factors = calculate_sentiment_risk(user_id)
    engagement_risk, engagement_factors = calculate_engagement_risk(user_id)
    performance_risk, performance_factors = calculate_performance_risk(user_id)
    
    total_risk = sentiment_risk + engagement_risk + performance_risk
    total_risk = min(total_risk, 10.0)
    
    # Determine risk level
    if total_risk < 3.0:
        risk_level = 'LOW'
    elif total_risk < 6.0:
        risk_level = 'MEDIUM'
    else:
        risk_level = 'HIGH'
    
    all_factors = sentiment_factors + engagement_factors + performance_factors
    
    return {
        'risk_score': round(total_risk, 2),
        'risk_level': risk_level,
        'risk_factors': all_factors,
        'sentiment_risk': round(sentiment_risk, 2),
        'engagement_risk': round(engagement_risk, 2),
        'performance_risk': round(performance_risk, 2)
    }

# ═══════════════════════════════════════════════════════════════════════════════
# ADAPTIVE RESPONSE STRATEGY
# ═══════════════════════════════════════════════════════════════════════════════

def get_adaptive_tone(user_id: str) -> Dict:
    """
    Get adaptive tone and approach based on risk level.
    Used internally to adjust chatbot behavior.
    """
    risk_assessment = assess_dropout_risk(user_id)
    risk_level = risk_assessment['risk_level']
    
    strategy = {
        'tone': 'standard',
        'difficulty_adjustment': 0,
        'encouragement_level': 'normal',
        'step_size': 'normal'
    }
    
    if risk_level == 'HIGH':
        strategy['tone'] = 'highly_supportive'
        strategy['difficulty_adjustment'] = -2  # Reduce difficulty
        strategy['encouragement_level'] = 'high'
        strategy['step_size'] = 'small'
    elif risk_level == 'MEDIUM':
        strategy['tone'] = 'supportive'
        strategy['difficulty_adjustment'] = -1
        strategy['encouragement_level'] = 'elevated'
        strategy['step_size'] = 'moderate'
    
    return strategy

# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND UPDATE
# ═══════════════════════════════════════════════════════════════════════════════

def update_risk_state_background(user_id: str):
    """
    Background task to update risk state.
    Called after each chat interaction.
    """
    risk_assessment = assess_dropout_risk(user_id)
    
    db.update_risk_state(
        user_id,
        risk_assessment['risk_score'],
        risk_assessment['risk_level'],
        risk_assessment['risk_factors']
    )

def should_intervene(user_id: str) -> bool:
    """
    Determine if gentle intervention is needed (internal use only).
    Does NOT alert user directly.
    """
    # Get fresh assessment
    risk_assessment = assess_dropout_risk(user_id)
    return risk_assessment['risk_level'] == 'HIGH'

def get_intervention_strategy(user_id: str) -> Dict:
    """
    Get intervention strategy for high-risk users.
    Returns subtle adjustments to make learning easier.
    """
    if not should_intervene(user_id):
        return {}
    
    return {
        'simplify_explanations': True,
        'increase_encouragement': True,
        'reduce_question_difficulty': True,
        'suggest_breaks': True,
        'focus_on_strengths': True
    }
