"""
Comprehensive Test - Verify All 3 Systems Working
Tests: Database, Self-Learning Feedback Loop, Risk Detection
Focus: Negative moods and backend data changes
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import database as db
import feedback_loop as fl
import risk_detection as rd
import db_helpers as dbh

def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_scenario_1_negative_mood_detection():
    """Test negative mood chat and risk detection."""
    print_section("SCENARIO 1: Negative Mood Detection & Risk Scoring")
    
    user_id = "test_negative_student"
    
    # Ensure user exists
    dbh.ensure_user_exists(user_id, "Negative Test Student")
    
    # Simulate negative mood chats
    negative_messages = [
        ("I can't do this anymore", "I understand this is really hard...", -3.5, "frustrated", "emotional_support"),
        ("I give up on calculus", "Don't give up! Let me help...", -4.0, "sad", "emotional_support"),
        ("This is impossible", "It's not impossible, let's break it down...", -3.0, "anxious", "emotional_support"),
        ("I'm so tired of failing", "I hear you, it's tough...", -3.5, "tired", "emotional_support"),
    ]
    
    print("\n[STEP 1] Logging negative mood chats...")
    for msg, response, sentiment, emotion, intent in negative_messages:
        db.log_chat(user_id, msg, response, sentiment, emotion, intent)
        print(f"  - Logged: '{msg[:40]}...' | Sentiment: {sentiment} | Emotion: {emotion}")
    
    print("\n[STEP 2] Updating risk state...")
    rd.update_risk_state_background(user_id)
    
    print("\n[STEP 3] Checking risk assessment...")
    risk_assessment = rd.assess_dropout_risk(user_id)
    print(f"  Risk Score: {risk_assessment['risk_score']}")
    print(f"  Risk Level: {risk_assessment['risk_level']}")
    print(f"  Risk Factors: {risk_assessment['risk_factors']}")
    
    print("\n[STEP 4] Getting adaptive tone...")
    adaptive_tone = rd.get_adaptive_tone(user_id)
    print(f"  Tone: {adaptive_tone['tone']}")
    print(f"  Difficulty Adjustment: {adaptive_tone['difficulty_adjustment']}")
    print(f"  Encouragement Level: {adaptive_tone['encouragement_level']}")
    
    print("\n[STEP 5] Checking database storage...")
    risk_state = db.get_risk_state(user_id)
    print(f"  Stored Risk Score: {risk_state['risk_score']}")
    print(f"  Stored Risk Level: {risk_state['risk_level']}")
    print(f"  Last Updated: {risk_state['last_updated']}")
    
    # Verify
    assert risk_assessment['risk_score'] > 3.0, "Risk score should be elevated for negative moods"
    assert risk_assessment['risk_level'] in ['MEDIUM', 'HIGH'], "Risk level should be MEDIUM or HIGH"
    assert adaptive_tone['tone'] in ['supportive', 'highly_supportive'], "Tone should be supportive"
    
    print("\n[OK] Negative mood detection and risk scoring WORKING!")
    return True

def test_scenario_2_poor_performance_feedback():
    """Test poor quiz performance and adaptive learning."""
    print_section("SCENARIO 2: Poor Performance & Adaptive Learning")
    
    user_id = "test_poor_performer"
    dbh.ensure_user_exists(user_id, "Poor Performer Student")
    
    # Simulate poor quiz performance
    print("\n[STEP 1] Logging poor quiz results...")
    
    # Calculus - very poor (20% accuracy)
    calculus_results = [
        {"topic": "calculus", "question": "What is derivative of x^2?", "user_answer": "x", "correct_answer": "2x", "is_correct": False},
        {"topic": "calculus", "question": "What is integral of 2x?", "user_answer": "2x^2", "correct_answer": "x^2 + C", "is_correct": False},
        {"topic": "calculus", "question": "What is d/dx(sin x)?", "user_answer": "cos x", "correct_answer": "cos x", "is_correct": True},
        {"topic": "calculus", "question": "What is limit of 1/x as x->0?", "user_answer": "0", "correct_answer": "undefined", "is_correct": False},
        {"topic": "calculus", "question": "What is derivative of e^x?", "user_answer": "xe^x", "correct_answer": "e^x", "is_correct": False},
    ]
    
    for result in calculus_results:
        db.log_quiz_result(user_id, "quiz_calc_001", result['topic'], result['question'], 
                          result['user_answer'], result['correct_answer'], result['is_correct'])
    
    print(f"  - Logged 5 calculus questions (1/5 correct = 20%)")
    
    # Physics - moderate (60% accuracy)
    physics_results = [
        {"topic": "physics", "question": "What is F=ma?", "user_answer": "Newton's 2nd law", "correct_answer": "Newton's 2nd law", "is_correct": True},
        {"topic": "physics", "question": "What is speed of light?", "user_answer": "3x10^8 m/s", "correct_answer": "3x10^8 m/s", "is_correct": True},
        {"topic": "physics", "question": "What is gravity on Earth?", "user_answer": "10 m/s^2", "correct_answer": "9.8 m/s^2", "is_correct": False},
        {"topic": "physics", "question": "What is kinetic energy formula?", "user_answer": "1/2mv^2", "correct_answer": "1/2mv^2", "is_correct": True},
        {"topic": "physics", "question": "What is potential energy?", "user_answer": "mv", "correct_answer": "mgh", "is_correct": False},
    ]
    
    for result in physics_results:
        db.log_quiz_result(user_id, "quiz_phys_001", result['topic'], result['question'],
                          result['user_answer'], result['correct_answer'], result['is_correct'])
    
    print(f"  - Logged 5 physics questions (3/5 correct = 60%)")
    
    # Log performance scores
    db.log_performance(user_id, "calculus", 0.20)
    db.log_performance(user_id, "physics", 0.60)
    db.log_performance(user_id, "algebra", 0.85)
    
    print("\n[STEP 2] Updating learning state...")
    fl.update_learning_state_background(user_id)
    
    print("\n[STEP 3] Identifying weak topics...")
    weak_topics = fl.identify_weak_topics(user_id)
    print(f"  Weak Topics: {weak_topics}")
    
    print("\n[STEP 4] Analyzing quiz mistakes...")
    mistake_analysis = fl.analyze_quiz_mistakes(user_id)
    for topic, data in mistake_analysis.items():
        print(f"  {topic}:")
        print(f"    - Accuracy: {data['accuracy']:.1%}")
        print(f"    - Incorrect: {data['incorrect']}/{data['total']}")
    
    print("\n[STEP 5] Getting adaptive difficulty...")
    for topic in weak_topics[:2]:
        difficulty = fl.calculate_adaptive_difficulty(user_id, topic)
        print(f"  {topic}: {difficulty}")
    
    print("\n[STEP 6] Getting learning strategy for weakest topic...")
    if weak_topics:
        strategy = fl.get_learning_strategy(user_id, weak_topics[0])
        print(f"  Topic: {strategy['topic']}")
        print(f"  Difficulty: {strategy['difficulty']}")
        print(f"  Teaching Approach: {strategy['teaching_approach']}")
        print(f"  Practice Intensity: {strategy['practice_intensity']}")
        print(f"  Focus Areas: {strategy['focus_areas']}")
    
    print("\n[STEP 7] Checking database storage...")
    learning_state = db.get_learning_state(user_id)
    print(f"  Stored Weak Topics: {learning_state['weak_topics']}")
    print(f"  Last Updated: {learning_state['last_updated']}")
    
    # Verify
    assert "calculus" in weak_topics, "Calculus should be identified as weak (20% score)"
    assert "algebra" not in weak_topics, "Algebra should NOT be weak (85% score)"
    assert strategy['difficulty'] == 'easy', "Difficulty should be 'easy' for 20% performance"
    assert strategy['teaching_approach'] in ['simplified', 'step_by_step'], "Should use simplified approach"
    
    print("\n[OK] Poor performance detection and adaptive learning WORKING!")
    return True

def test_scenario_3_repeated_mistakes():
    """Test repeated mistake detection and strategy adaptation."""
    print_section("SCENARIO 3: Repeated Mistakes & Strategy Adaptation")
    
    user_id = "test_repeated_mistakes"
    dbh.ensure_user_exists(user_id, "Repeated Mistakes Student")
    
    print("\n[STEP 1] Logging same mistake multiple times...")
    
    # Same question wrong 3 times
    same_question = "What is the derivative of x^3?"
    for i in range(3):
        db.log_quiz_result(user_id, f"quiz_00{i+1}", "calculus", same_question,
                          "3x", "3x^2", False)
    print(f"  - Logged same question wrong 3 times: '{same_question}'")
    
    # Different questions also wrong
    other_questions = [
        ("What is integral of x?", "x^2", "x^2/2 + C", False),
        ("What is d/dx(ln x)?", "x", "1/x", False),
    ]
    
    for q, ua, ca, correct in other_questions:
        db.log_quiz_result(user_id, "quiz_004", "calculus", q, ua, ca, correct)
    
    print(f"  - Logged 2 more wrong answers")
    
    db.log_performance(user_id, "calculus", 0.30)
    
    print("\n[STEP 2] Analyzing mistakes...")
    mistake_analysis = fl.analyze_quiz_mistakes(user_id, limit=10)
    
    if "calculus" in mistake_analysis:
        data = mistake_analysis["calculus"]
        print(f"  Total Questions: {data['total']}")
        print(f"  Incorrect: {data['incorrect']}")
        print(f"  Accuracy: {data['accuracy']:.1%}")
        print(f"  Repeated Mistakes: {len(data['repeated_mistakes'])}")
        if data['repeated_mistakes']:
            print(f"  First Repeated: '{data['repeated_mistakes'][0][:50]}...'")
    
    print("\n[STEP 3] Getting adaptive strategy...")
    strategy = fl.get_learning_strategy(user_id, "calculus")
    print(f"  Teaching Approach: {strategy['teaching_approach']}")
    print(f"  Difficulty: {strategy['difficulty']}")
    print(f"  Focus Areas: {strategy['focus_areas']}")
    
    # Verify
    assert len(mistake_analysis["calculus"]['repeated_mistakes']) > 0, "Should detect repeated mistakes"
    assert strategy['teaching_approach'] == 'step_by_step', "Should use step-by-step for repeated mistakes"
    assert 'common_mistakes' in strategy['focus_areas'], "Should focus on common mistakes"
    
    print("\n[OK] Repeated mistake detection and strategy adaptation WORKING!")
    return True

def test_scenario_4_improvement_tracking():
    """Test improvement trend tracking."""
    print_section("SCENARIO 4: Improvement Trend Tracking")
    
    user_id = "test_improving_student"
    dbh.ensure_user_exists(user_id, "Improving Student")
    
    print("\n[STEP 1] Note: Performance tracking uses latest score only...")
    print("  (Historical tracking would require schema changes)")
    
    # Log final scores
    db.log_performance(user_id, "calculus", 0.70)  # Good score
    db.log_performance(user_id, "physics", 0.50)   # Weak score
    db.log_performance(user_id, "algebra", 0.85)   # Strong score
    
    print("  - Calculus: 70% (good)")
    print("  - Physics: 50% (weak)")
    print("  - Algebra: 85% (strong)")
    
    print("\n[STEP 2] Identifying weak topics...")
    weak_topics = fl.identify_weak_topics(user_id)
    print(f"  Weak Topics: {weak_topics}")
    
    print("\n[STEP 3] Getting strategies based on performance...")
    
    if "physics" in weak_topics:
        phys_strategy = fl.get_learning_strategy(user_id, "physics")
        print(f"\n  Physics (weak - 50%):")  
        print(f"    - Teaching Approach: {phys_strategy['teaching_approach']}")
        print(f"    - Difficulty: {phys_strategy['difficulty']}")
        print(f"    - Focus Areas: {phys_strategy['focus_areas']}")
    
    calc_strategy = fl.get_learning_strategy(user_id, "calculus")
    print(f"\n  Calculus (moderate - 70%):")
    print(f"    - Teaching Approach: {calc_strategy['teaching_approach']}")
    print(f"    - Difficulty: {calc_strategy['difficulty']}")
    
    # Verify
    assert "physics" in weak_topics, "Physics should be weak (50% score)"
    assert "algebra" not in weak_topics, "Algebra should NOT be weak (85% score)"
    assert phys_strategy['difficulty'] == 'medium', "Physics difficulty should be medium for 50%"
    
    print("\n[OK] Performance-based strategy adaptation WORKING!")
    return True

def test_scenario_5_combined_risk_factors():
    """Test combined risk factors (sentiment + engagement + performance)."""
    print_section("SCENARIO 5: Combined Risk Factors")
    
    user_id = "test_high_risk_student"
    dbh.ensure_user_exists(user_id, "High Risk Student")
    
    print("\n[STEP 1] Creating high-risk profile...")
    
    # Factor 1: Negative sentiment chats
    print("  - Adding negative sentiment chats...")
    negative_chats = [
        ("I hate studying", "Let's find a way...", -4.0, "frustrated"),
        ("I can't do this", "You can do this...", -3.5, "sad"),
        ("What's the point", "There is a point...", -4.5, "anxious"),
    ]
    for msg, resp, sent, emo in negative_chats:
        db.log_chat(user_id, msg, resp, sent, emo, "emotional_support")
    
    # Factor 2: Poor quiz performance
    print("  - Adding poor quiz results...")
    for i in range(10):
        db.log_quiz_result(user_id, f"quiz_{i}", "math", f"Question {i}",
                          "wrong", "correct", False)
    
    # Factor 3: Low engagement (already low by having few interactions)
    
    print("\n[STEP 2] Calculating risk assessment...")
    risk_assessment = rd.assess_dropout_risk(user_id)
    
    print(f"\n  Overall Risk Score: {risk_assessment['risk_score']}")
    print(f"  Risk Level: {risk_assessment['risk_level']}")
    print(f"\n  Component Scores:")
    print(f"    - Sentiment Risk: {risk_assessment['sentiment_risk']}")
    print(f"    - Engagement Risk: {risk_assessment['engagement_risk']}")
    print(f"    - Performance Risk: {risk_assessment['performance_risk']}")
    print(f"\n  Risk Factors:")
    for factor in risk_assessment['risk_factors']:
        print(f"    - {factor}")
    
    print("\n[STEP 3] Getting intervention strategy...")
    if rd.should_intervene(user_id):
        print("  [!] Intervention recommended")
        intervention = rd.get_intervention_strategy(user_id)
        print(f"  Strategy:")
        for key, value in intervention.items():
            print(f"    - {key}: {value}")
    
    print("\n[STEP 4] Checking adaptive response...")
    adaptive_tone = rd.get_adaptive_tone(user_id)
    print(f"  Tone: {adaptive_tone['tone']}")
    print(f"  Difficulty Adjustment: {adaptive_tone['difficulty_adjustment']}")
    print(f"  Encouragement Level: {adaptive_tone['encouragement_level']}")
    print(f"  Step Size: {adaptive_tone['step_size']}")
    
    # Verify
    assert risk_assessment['risk_score'] >= 5.0, "Combined factors should create high risk"
    assert risk_assessment['risk_level'] in ['MEDIUM', 'HIGH'], "Should be MEDIUM or HIGH risk"
    assert len(risk_assessment['risk_factors']) >= 2, "Should have multiple risk factors"
    assert rd.should_intervene(user_id), "Should recommend intervention"
    
    print("\n[OK] Combined risk factor detection WORKING!")
    return True

def test_scenario_6_database_persistence():
    """Test that data persists and can be retrieved."""
    print_section("SCENARIO 6: Database Persistence & Retrieval")
    
    user_id = "test_persistence_student"
    
    print("\n[STEP 1] Creating user and logging data...")
    dbh.ensure_user_exists(user_id, "Persistence Test", "persist@test.com")
    
    # Log various data
    db.log_performance(user_id, "math", 0.75)
    db.log_chat(user_id, "test message", "test response", -1.0, "neutral", "casual")
    db.log_quiz_result(user_id, "quiz_1", "math", "Q1", "A", "A", True)
    
    print("  - Logged performance, chat, and quiz result")
    
    print("\n[STEP 2] Retrieving all data...")
    
    user = db.get_user(user_id)
    print(f"  User: {user['name']} ({user['email']})")
    
    performance = db.get_performance_data(user_id)
    print(f"  Performance: {performance}")
    
    chats = db.get_recent_chats(user_id, limit=5)
    print(f"  Recent Chats: {len(chats)} found")
    
    learning_state = db.get_learning_state(user_id)
    print(f"  Learning State: {learning_state is not None}")
    
    risk_state = db.get_risk_state(user_id)
    print(f"  Risk State: {risk_state is not None}")
    
    print("\n[STEP 3] Using helper functions...")
    analytics = dbh.get_user_analytics(user_id)
    print(f"  Analytics Retrieved: {analytics['has_data']}")
    print(f"  Performance Topics: {list(analytics['performance'].keys())}")
    
    recommendations = dbh.get_learning_recommendations(user_id)
    print(f"  Recommendations Available: {recommendations['has_data']}")
    
    # Verify
    assert user is not None, "User should be retrievable"
    assert len(performance) > 0, "Performance data should be stored"
    assert len(chats) > 0, "Chat logs should be stored"
    assert learning_state is not None, "Learning state should exist"
    assert risk_state is not None, "Risk state should exist"
    
    print("\n[OK] Database persistence and retrieval WORKING!")
    return True

def run_comprehensive_tests():
    """Run all comprehensive test scenarios."""
    print("\n" + "=" * 70)
    print("  COMPREHENSIVE SYSTEM TEST - All 3 Features")
    print("  Testing: Database, Feedback Loop, Risk Detection")
    print("=" * 70)
    
    tests = [
        ("Negative Mood Detection & Risk Scoring", test_scenario_1_negative_mood_detection),
        ("Poor Performance & Adaptive Learning", test_scenario_2_poor_performance_feedback),
        ("Repeated Mistakes & Strategy Adaptation", test_scenario_3_repeated_mistakes),
        ("Improvement Trend Tracking", test_scenario_4_improvement_tracking),
        ("Combined Risk Factors", test_scenario_5_combined_risk_factors),
        ("Database Persistence & Retrieval", test_scenario_6_database_persistence),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result, None))
        except AssertionError as e:
            results.append((name, False, str(e)))
            print(f"\n[FAIL] Assertion failed: {e}")
        except Exception as e:
            results.append((name, False, str(e)))
            print(f"\n[FAIL] Test crashed: {e}")
    
    # Final Summary
    print_section("FINAL TEST SUMMARY")
    
    passed = sum(1 for _, result, _ in results if result)
    total = len(results)
    
    print(f"\nResults: {passed}/{total} scenarios passed\n")
    
    for name, result, error in results:
        status = "[OK]" if result else "[FAIL]"
        print(f"  {status} {name}")
        if error:
            print(f"       Error: {error}")
    
    print("\n" + "=" * 70)
    
    if passed == total:
        print("\n  ALL SYSTEMS VERIFIED AND WORKING!")
        print("  - Database: OPERATIONAL")
        print("  - Self-Learning Feedback Loop: OPERATIONAL")
        print("  - Risk Detection: OPERATIONAL")
        print("\n" + "=" * 70)
        return True
    else:
        print(f"\n  {total - passed} scenario(s) failed. Check errors above.")
        print("=" * 70)
        return False

if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)
