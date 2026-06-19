"""
Database Integration Helpers
Easy-to-use functions for integrating database features into existing endpoints.
"""

from typing import Dict, List, Optional
import database as db
import feedback_loop as fl
import risk_detection as rd

# ═══════════════════════════════════════════════════════════════════════════════
# PERFORMANCE LOGGING
# ═══════════════════════════════════════════════════════════════════════════════

def log_quiz_completion(user_id: str, quiz_id: str, results: List[Dict]):
    """
    Log quiz completion with all question results.
    
    Args:
        user_id: User identifier
        quiz_id: Quiz identifier
        results: List of dicts with keys: topic, question, user_answer, correct_answer, is_correct
    """
    try:
        for result in results:
            db.log_quiz_result(
                user_id,
                quiz_id,
                result.get('topic', 'general'),
                result.get('question', ''),
                result.get('user_answer', ''),
                result.get('correct_answer', ''),
                result.get('is_correct', False)
            )
        
        # Update learning state in background
        fl.update_learning_state_background(user_id)
        
    except Exception as e:
        print(f"Error logging quiz: {e}")

def log_topic_performance(user_id: str, topic: str, score: float):
    """
    Log performance for a specific topic.
    
    Args:
        user_id: User identifier
        topic: Topic name
        score: Performance score (0.0 to 1.0)
    """
    try:
        db.log_performance(user_id, topic, score)
        fl.update_learning_state_background(user_id)
    except Exception as e:
        print(f"Error logging performance: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# ADAPTIVE LEARNING
# ═══════════════════════════════════════════════════════════════════════════════

def get_weak_topics_for_user(user_id: str, limit: int = 5) -> List[str]:
    """Get weak topics for a user based on performance."""
    try:
        return fl.identify_weak_topics(user_id)[:limit]
    except Exception:
        return []

def get_learning_recommendations(user_id: str) -> Dict:
    """
    Get personalized learning recommendations.
    
    Returns:
        {
            'prioritized_topics': [...],
            'strategies': {...},
            'weak_areas': [...]
        }
    """
    try:
        prioritized = fl.get_prioritized_topics(user_id, limit=3)
        weak_topics = fl.identify_weak_topics(user_id)
        
        return {
            'prioritized_topics': prioritized,
            'weak_areas': weak_topics[:5],
            'has_data': len(weak_topics) > 0
        }
    except Exception:
        return {
            'prioritized_topics': [],
            'weak_areas': [],
            'has_data': False
        }

def get_adaptive_difficulty_for_topic(user_id: str, topic: str) -> str:
    """Get adaptive difficulty level for a topic."""
    try:
        return fl.calculate_adaptive_difficulty(user_id, topic)
    except Exception:
        return 'medium'

# ═══════════════════════════════════════════════════════════════════════════════
# RISK MONITORING
# ═══════════════════════════════════════════════════════════════════════════════

def get_user_risk_level(user_id: str) -> str:
    """Get current risk level for user (LOW/MEDIUM/HIGH)."""
    try:
        risk_state = db.get_risk_state(user_id)
        return risk_state['risk_level'] if risk_state else 'LOW'
    except Exception:
        return 'LOW'

def should_use_supportive_tone(user_id: str) -> bool:
    """Check if supportive tone should be used."""
    try:
        adaptive_tone = rd.get_adaptive_tone(user_id)
        return adaptive_tone['tone'] in ['supportive', 'highly_supportive']
    except Exception:
        return False

def get_tone_adjustment(user_id: str) -> Dict:
    """Get tone and difficulty adjustments for user."""
    try:
        return rd.get_adaptive_tone(user_id)
    except Exception:
        return {
            'tone': 'standard',
            'difficulty_adjustment': 0,
            'encouragement_level': 'normal',
            'step_size': 'normal'
        }

# ═══════════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

def ensure_user_exists(user_id: str, name: str = "Student", email: str = None):
    """Ensure user exists in database, create if not."""
    try:
        user = db.get_user(user_id)
        if not user:
            email = email or f"{user_id}@student.local"
            db.create_user(user_id, name, email)
    except Exception as e:
        print(f"Error ensuring user: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════

def get_user_analytics(user_id: str) -> Dict:
    """Get comprehensive analytics for a user."""
    try:
        performance = db.get_performance_data(user_id)
        learning_state = db.get_learning_state(user_id)
        risk_state = db.get_risk_state(user_id)
        recent_chats = db.get_recent_chats(user_id, limit=5)
        
        return {
            'performance': performance,
            'learning_state': learning_state,
            'risk_state': risk_state,
            'recent_activity': len(recent_chats),
            'has_data': len(performance) > 0
        }
    except Exception:
        return {
            'performance': {},
            'learning_state': None,
            'risk_state': None,
            'recent_activity': 0,
            'has_data': False
        }
