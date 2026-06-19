"""
Database Module - SQLite Setup
Handles persistent storage for user data, performance tracking, and risk detection.
"""

import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'edtech.db')

def get_connection():
    """Get database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with all required tables."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            grade TEXT,
            stream TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # PerformanceData table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS performance_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            topic TEXT NOT NULL,
            score REAL NOT NULL,
            attempts INTEGER DEFAULT 1,
            last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # ChatLogs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            response TEXT,
            sentiment_score REAL,
            emotion TEXT,
            intent TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # LearningState table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS learning_state (
            user_id TEXT PRIMARY KEY,
            weak_topics TEXT,
            improvement_trend TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # RiskState table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS risk_state (
            user_id TEXT PRIMARY KEY,
            risk_score REAL DEFAULT 0.0,
            risk_level TEXT DEFAULT 'LOW',
            risk_factors TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # QuizResults table (for detailed quiz tracking)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            quiz_id TEXT,
            topic TEXT,
            question TEXT,
            user_answer TEXT,
            correct_answer TEXT,
            is_correct INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("[OK] Database initialized successfully")

# ═══════════════════════════════════════════════════════════════════════════════
# USER OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

def create_user(user_id: str, name: str, email: str, grade: str = '11', stream: str = 'PCM'):
    """Create a new user."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (user_id, name, email, grade, stream)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, name, email, grade, stream))
        conn.commit()
        
        # Initialize learning state and risk state
        cursor.execute('INSERT INTO learning_state (user_id, weak_topics, improvement_trend) VALUES (?, ?, ?)',
                      (user_id, '[]', '[]'))
        cursor.execute('INSERT INTO risk_state (user_id, risk_score, risk_factors) VALUES (?, ?, ?)',
                      (user_id, 0.0, '[]'))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_user(user_id: str) -> Optional[Dict]:
    """Get user by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# ═══════════════════════════════════════════════════════════════════════════════
# PERFORMANCE TRACKING
# ═══════════════════════════════════════════════════════════════════════════════

def log_performance(user_id: str, topic: str, score: float):
    """Log performance data for a topic."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if topic exists for user
    cursor.execute('''
        SELECT id, attempts FROM performance_data 
        WHERE user_id = ? AND topic = ?
    ''', (user_id, topic))
    existing = cursor.fetchone()
    
    if existing:
        # Update existing record
        cursor.execute('''
            UPDATE performance_data 
            SET score = ?, attempts = ?, last_attempt = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (score, existing['attempts'] + 1, existing['id']))
    else:
        # Insert new record
        cursor.execute('''
            INSERT INTO performance_data (user_id, topic, score, attempts)
            VALUES (?, ?, ?, 1)
        ''', (user_id, topic, score))
    
    conn.commit()
    conn.close()

def get_performance_data(user_id: str) -> Dict[str, float]:
    """Get all performance data for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT topic, score FROM performance_data 
        WHERE user_id = ?
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return {row['topic']: row['score'] for row in rows}

def log_quiz_result(user_id: str, quiz_id: str, topic: str, question: str, 
                   user_answer: str, correct_answer: str, is_correct: bool):
    """Log individual quiz question result."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO quiz_results 
        (user_id, quiz_id, topic, question, user_answer, correct_answer, is_correct)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, quiz_id, topic, question, user_answer, correct_answer, int(is_correct)))
    conn.commit()
    conn.close()

# ═══════════════════════════════════════════════════════════════════════════════
# CHAT LOGGING
# ═══════════════════════════════════════════════════════════════════════════════

def log_chat(user_id: str, message: str, response: str, sentiment_score: float, 
             emotion: str, intent: str):
    """Log chat interaction."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO chat_logs 
        (user_id, message, response, sentiment_score, emotion, intent)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, message, response, sentiment_score, emotion, intent))
    conn.commit()
    conn.close()

def get_recent_chats(user_id: str, limit: int = 10) -> List[Dict]:
    """Get recent chat logs for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM chat_logs 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    ''', (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ═══════════════════════════════════════════════════════════════════════════════
# LEARNING STATE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

def update_learning_state(user_id: str, weak_topics: List[str], improvement_trend: List[Dict]):
    """Update learning state for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE learning_state 
        SET weak_topics = ?, improvement_trend = ?, last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ?
    ''', (json.dumps(weak_topics), json.dumps(improvement_trend), user_id))
    conn.commit()
    conn.close()

def get_learning_state(user_id: str) -> Optional[Dict]:
    """Get learning state for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM learning_state WHERE user_id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        data['weak_topics'] = json.loads(data['weak_topics'])
        data['improvement_trend'] = json.loads(data['improvement_trend'])
        return data
    return None

# ═══════════════════════════════════════════════════════════════════════════════
# RISK STATE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

def update_risk_state(user_id: str, risk_score: float, risk_level: str, risk_factors: List[str]):
    """Update risk state for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE risk_state 
        SET risk_score = ?, risk_level = ?, risk_factors = ?, last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ?
    ''', (risk_score, risk_level, json.dumps(risk_factors), user_id))
    conn.commit()
    conn.close()

def get_risk_state(user_id: str) -> Optional[Dict]:
    """Get risk state for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM risk_state WHERE user_id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        data['risk_factors'] = json.loads(data['risk_factors'])
        return data
    return None

# Initialize database on module import
init_database()
