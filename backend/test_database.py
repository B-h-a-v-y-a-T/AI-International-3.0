"""
Test Script for Database & Adaptive Learning Features
Run this to verify everything is working correctly.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

def test_database_init():
    """Test database initialization."""
    print("=" * 60)
    print("TEST 1: Database Initialization")
    print("=" * 60)
    try:
        import database as db
        print("[OK] Database module imported successfully")
        print(f"[OK] Database file: {db.DB_PATH}")
        return True
    except Exception as e:
        print(f"[FAIL] Database initialization failed: {e}")
        return False

def test_user_operations():
    """Test user creation and retrieval."""
    print("\n" + "=" * 60)
    print("TEST 2: User Operations")
    print("=" * 60)
    try:
        import database as db
        
        # Create test user
        user_id = "test_student_001"
        result = db.create_user(user_id, "Test Student", "test@example.com", "12", "PCM")
        print(f"[OK] User created: {user_id}")
        
        # Retrieve user
        user = db.get_user(user_id)
        print(f"[OK] User retrieved: {user['name']}")
        
        return True
    except Exception as e:
        print(f"[FAIL] User operations failed: {e}")
        return False

def test_performance_logging():
    """Test performance data logging."""
    print("\n" + "=" * 60)
    print("TEST 3: Performance Logging")
    print("=" * 60)
    try:
        import database as db
        
        user_id = "test_student_001"
        
        # Log performance
        db.log_performance(user_id, "calculus", 0.65)
        db.log_performance(user_id, "algebra", 0.80)
        db.log_performance(user_id, "physics", 0.45)
        print("[OK] Performance data logged")
        
        # Retrieve performance
        performance = db.get_performance_data(user_id)
        print(f"[OK] Performance retrieved: {performance}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Performance logging failed: {e}")
        return False

def test_quiz_logging():
    """Test quiz result logging."""
    print("\n" + "=" * 60)
    print("TEST 4: Quiz Result Logging")
    print("=" * 60)
    try:
        import database as db
        
        user_id = "test_student_001"
        
        # Log quiz results
        db.log_quiz_result(
            user_id, "quiz_001", "calculus",
            "What is the derivative of x^2?",
            "2x", "2x", True
        )
        db.log_quiz_result(
            user_id, "quiz_001", "calculus",
            "What is the integral of 2x?",
            "x^2", "x^2 + C", False
        )
        print("[OK] Quiz results logged")
        
        return True
    except Exception as e:
        print(f"[FAIL] Quiz logging failed: {e}")
        return False

def test_chat_logging():
    """Test chat interaction logging."""
    print("\n" + "=" * 60)
    print("TEST 5: Chat Logging")
    print("=" * 60)
    try:
        import database as db
        
        user_id = "test_student_001"
        
        # Log chat
        db.log_chat(
            user_id,
            "I don't understand derivatives",
            "Let me explain derivatives simply...",
            -1.5,
            "confused",
            "study_help"
        )
        print("[OK] Chat logged")
        
        # Retrieve recent chats
        chats = db.get_recent_chats(user_id, limit=5)
        print(f"[OK] Retrieved {len(chats)} recent chats")
        
        return True
    except Exception as e:
        print(f"[FAIL] Chat logging failed: {e}")
        return False

def test_feedback_loop():
    """Test self-learning feedback loop."""
    print("\n" + "=" * 60)
    print("TEST 6: Self-Learning Feedback Loop")
    print("=" * 60)
    try:
        import feedback_loop as fl
        
        user_id = "test_student_001"
        
        # Identify weak topics
        weak_topics = fl.identify_weak_topics(user_id)
        print(f"[OK] Weak topics identified: {weak_topics}")
        
        # Get learning strategy
        if weak_topics:
            strategy = fl.get_learning_strategy(user_id, weak_topics[0])
            print(f"[OK] Learning strategy: {strategy['teaching_approach']}, difficulty: {strategy['difficulty']}")
        
        # Update learning state
        fl.update_learning_state_background(user_id)
        print("[OK] Learning state updated")
        
        return True
    except Exception as e:
        print(f"[FAIL] Feedback loop failed: {e}")
        return False

def test_risk_detection():
    """Test mental risk detection."""
    print("\n" + "=" * 60)
    print("TEST 7: Mental Risk Detection")
    print("=" * 60)
    try:
        import risk_detection as rd
        import database as db
        
        user_id = "test_student_001"
        
        # Assess risk
        risk_assessment = rd.assess_dropout_risk(user_id)
        print(f"[OK] Risk assessment completed")
        print(f"   Risk Level: {risk_assessment['risk_level']}")
        print(f"   Risk Score: {risk_assessment['risk_score']}")
        
        # Update risk state
        rd.update_risk_state_background(user_id)
        print("[OK] Risk state updated")
        
        # Get adaptive tone
        tone = rd.get_adaptive_tone(user_id)
        print(f"[OK] Adaptive tone: {tone['tone']}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Risk detection failed: {e}")
        return False

def test_db_helpers():
    """Test database helper functions."""
    print("\n" + "=" * 60)
    print("TEST 8: Database Helpers")
    print("=" * 60)
    try:
        import db_helpers as dbh
        
        user_id = "test_student_001"
        
        # Get recommendations
        recommendations = dbh.get_learning_recommendations(user_id)
        print(f"[OK] Learning recommendations: {len(recommendations['prioritized_topics'])} topics")
        
        # Get analytics
        analytics = dbh.get_user_analytics(user_id)
        print(f"[OK] User analytics retrieved: {analytics['has_data']}")
        
        # Get weak topics
        weak = dbh.get_weak_topics_for_user(user_id)
        print(f"[OK] Weak topics: {weak}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Database helpers failed: {e}")
        return False

def test_tutor_engine_integration():
    """Test tutor engine integration."""
    print("\n" + "=" * 60)
    print("TEST 9: Tutor Engine Integration")
    print("=" * 60)
    try:
        from tutor_engine import tutor_engine
        
        user_id = "test_student_001"
        
        # Call tutor engine with user_id
        response = tutor_engine(
            "explain derivatives",
            {"calculus": 0.65, "algebra": 0.80},
            {"calculus": 0.60, "algebra": 0.75},
            user_id
        )
        
        print(f"[OK] Tutor engine response generated")
        print(f"   Mood: {response['mood']}")
        print(f"   Intent: {response['intent']}")
        print(f"   Action: {response['decided_action']}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Tutor engine integration failed: {e}")
        return False

def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("DATABASE & ADAPTIVE LEARNING SYSTEM - TEST SUITE")
    print("=" * 60 + "\n")
    
    tests = [
        test_database_init,
        test_user_operations,
        test_performance_logging,
        test_quiz_logging,
        test_chat_logging,
        test_feedback_loop,
        test_risk_detection,
        test_db_helpers,
        test_tutor_engine_integration
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"[FAIL] Test crashed: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\nALL TESTS PASSED! System is ready to use.")
    else:
        print("\nSome tests failed. Check errors above.")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    run_all_tests()

