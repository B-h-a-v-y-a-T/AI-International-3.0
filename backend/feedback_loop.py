"""
Self-Learning Feedback Loop
Analyzes performance data and adapts teaching strategies based on user mistakes and progress.
"""

from typing import Dict, List, Tuple
from collections import defaultdict
import database as db

# ═══════════════════════════════════════════════════════════════════════════════
# WEAK TOPIC IDENTIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

def identify_weak_topics(user_id: str) -> List[str]:
    """
    Identify weak topics based on performance data.
    Returns topics sorted by weakness (worst first).
    """
    performance = db.get_performance_data(user_id)
    
    if not performance:
        return []
    
    # Topics with score < 0.6 are considered weak
    weak_topics = [(topic, score) for topic, score in performance.items() if score < 0.6]
    
    # Sort by score (ascending) - weakest first
    weak_topics.sort(key=lambda x: x[1])
    
    return [topic for topic, _ in weak_topics]

def analyze_quiz_mistakes(user_id: str, limit: int = 50) -> Dict[str, Dict]:
    """
    Analyze recent quiz mistakes to identify patterns.
    Returns topic-wise mistake analysis.
    """
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT topic, question, user_answer, correct_answer, is_correct
        FROM quiz_results
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (user_id, limit))
    
    results = cursor.fetchall()
    conn.close()
    
    topic_analysis = defaultdict(lambda: {
        'total': 0,
        'incorrect': 0,
        'accuracy': 0.0,
        'repeated_mistakes': []
    })
    
    mistake_tracker = defaultdict(int)
    
    for row in results:
        topic = row['topic']
        is_correct = bool(row['is_correct'])
        
        topic_analysis[topic]['total'] += 1
        if not is_correct:
            topic_analysis[topic]['incorrect'] += 1
            mistake_key = f"{topic}:{row['question'][:50]}"
            mistake_tracker[mistake_key] += 1
    
    # Calculate accuracy and identify repeated mistakes
    for topic, data in topic_analysis.items():
        if data['total'] > 0:
            data['accuracy'] = (data['total'] - data['incorrect']) / data['total']
        
        # Find repeated mistakes (same question wrong multiple times)
        repeated = [k.split(':', 1)[1] for k, count in mistake_tracker.items() 
                   if k.startswith(topic) and count > 1]
        data['repeated_mistakes'] = repeated
    
    return dict(topic_analysis)

# ═══════════════════════════════════════════════════════════════════════════════
# IMPROVEMENT TRACKING
# ═══════════════════════════════════════════════════════════════════════════════

def track_improvement(user_id: str) -> Dict[str, str]:
    """
    Track improvement trends for each topic.
    Returns: {'topic': 'improving' | 'declining' | 'stable'}
    """
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT topic, score, last_attempt
        FROM performance_data
        WHERE user_id = ?
        ORDER BY topic, last_attempt ASC
    ''', (user_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    topic_history = defaultdict(list)
    for row in results:
        topic_history[row['topic']].append(row['score'])
    
    trends = {}
    for topic, scores in topic_history.items():
        if len(scores) < 2:
            trends[topic] = 'stable'
        else:
            # Get last 3 scores (most recent)
            recent = scores[-3:] if len(scores) >= 3 else scores
            if len(recent) >= 2:
                # Compare most recent to oldest in the window
                if recent[-1] > recent[0] + 0.1:
                    trends[topic] = 'improving'
                elif recent[-1] < recent[0] - 0.1:
                    trends[topic] = 'declining'
                else:
                    trends[topic] = 'stable'
    
    return trends

# ═══════════════════════════════════════════════════════════════════════════════
# ADAPTIVE DIFFICULTY
# ═══════════════════════════════════════════════════════════════════════════════

def calculate_adaptive_difficulty(user_id: str, topic: str) -> str:
    """
    Calculate appropriate difficulty level for a topic.
    Returns: 'easy' | 'medium' | 'hard'
    """
    performance = db.get_performance_data(user_id)
    score = performance.get(topic, 0.5)
    
    # Check for repeated mistakes
    mistake_analysis = analyze_quiz_mistakes(user_id, limit=20)
    repeated_mistakes = len(mistake_analysis.get(topic, {}).get('repeated_mistakes', []))
    
    # Adjust difficulty based on performance and mistakes
    if score < 0.4 or repeated_mistakes > 2:
        return 'easy'
    elif score < 0.7:
        return 'medium'
    else:
        return 'hard'

# ═══════════════════════════════════════════════════════════════════════════════
# LEARNING STRATEGY ADAPTATION
# ═══════════════════════════════════════════════════════════════════════════════

def get_learning_strategy(user_id: str, topic: str) -> Dict:
    """
    Get adaptive learning strategy for a topic based on performance.
    """
    performance = db.get_performance_data(user_id)
    score = performance.get(topic, 0.5)
    
    mistake_analysis = analyze_quiz_mistakes(user_id)
    topic_data = mistake_analysis.get(topic, {})
    
    trends = track_improvement(user_id)
    trend = trends.get(topic, 'stable')
    
    strategy = {
        'topic': topic,
        'difficulty': calculate_adaptive_difficulty(user_id, topic),
        'focus_areas': [],
        'teaching_approach': 'standard',
        'practice_intensity': 'medium'
    }
    
    # Adapt based on performance
    if score < 0.4:
        strategy['teaching_approach'] = 'simplified'
        strategy['practice_intensity'] = 'high'
        strategy['focus_areas'].append('fundamentals')
    elif score < 0.7:
        strategy['teaching_approach'] = 'standard'
        strategy['practice_intensity'] = 'medium'
    else:
        strategy['teaching_approach'] = 'advanced'
        strategy['practice_intensity'] = 'low'
        strategy['focus_areas'].append('advanced_concepts')
    
    # Adapt based on repeated mistakes
    if len(topic_data.get('repeated_mistakes', [])) > 0:
        strategy['teaching_approach'] = 'step_by_step'
        strategy['focus_areas'].append('common_mistakes')
    
    # Adapt based on trend
    if trend == 'declining':
        strategy['teaching_approach'] = 'review_basics'
        strategy['practice_intensity'] = 'high'
    elif trend == 'improving':
        strategy['focus_areas'].append('challenge_problems')
    
    return strategy

# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND UPDATE
# ═══════════════════════════════════════════════════════════════════════════════

def update_learning_state_background(user_id: str):
    """
    Background task to update learning state based on recent performance.
    Called after quiz completion or performance logging.
    """
    weak_topics = identify_weak_topics(user_id)
    trends = track_improvement(user_id)
    
    improvement_trend = [
        {'topic': topic, 'trend': trend}
        for topic, trend in trends.items()
    ]
    
    db.update_learning_state(user_id, weak_topics, improvement_trend)

def get_prioritized_topics(user_id: str, limit: int = 3) -> List[Dict]:
    """
    Get prioritized topics for learning based on weakness and trends.
    """
    weak_topics = identify_weak_topics(user_id)
    trends = track_improvement(user_id)
    
    prioritized = []
    for topic in weak_topics[:limit]:
        strategy = get_learning_strategy(user_id, topic)
        prioritized.append({
            'topic': topic,
            'trend': trends.get(topic, 'stable'),
            'strategy': strategy
        })
    
    return prioritized
