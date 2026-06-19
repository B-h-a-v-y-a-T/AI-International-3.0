# main.py

from models import UserState
from agent import LearningAgent


def ask_questions(quiz):
    answers = []

    for i, q in enumerate(quiz.get("questions", [])):
        print(f"\nQ{i+1}: {q['question']}")

        for opt in q["options"]:
            print(opt)

        ans = input("Your Answer (A/B/C/D): ")
        answers.append(ans)

    return answers


def show_feedback(result):
    print("\n--- 🧠 FEEDBACK ---")

    for fb in result.get("question_feedback", []):
        print("\nQ:", fb["question"])
        print("Your Answer:", fb["student_answer"])
        print("Correct Answer:", fb["correct_answer"])
        print("Result:", "✅" if fb["is_correct"] else "❌")
        print("Explanation:", fb["explanation"])


def main():
    user = UserState()
    agent = LearningAgent(user)

    print("=== AGENTIC LEARNING SYSTEM ===\n")

    domain = input("Enter domain (math/chemistry/ai): ")

    # Initial quiz
    quiz = agent.generate_initial_quiz(domain)
    answers = ask_questions(quiz)

    result = agent.evaluate(quiz, answers)
    show_feedback(result)

    topic_scores = result["topic_scores"]
    current_topic = min(topic_scores, key=topic_scores.get)
    user.current_topic = current_topic

    print(f"\n👉 Starting Topic: {current_topic}")

    # Learning loop
    for day in range(1, 6):
        print(f"\n--- Day {day} ---")
        print("📚 Topic:", user.current_topic)

        quiz = agent.generate_topic_quiz(user.current_topic)
        answers = ask_questions(quiz)

        result = agent.evaluate(quiz, answers)
        show_feedback(result)

        score = result["overall_score"]
        print("\n📊 Score:", score)

        print("\n--- 🔍 AGENT REASONING ---")
        if score < 0.5:
            print("Weak → moving to prerequisite")
        else:
            print("Good → staying or progressing")

        next_topic = agent.decide_next_topic(user.current_topic, score)

        if next_topic:
            print("👉 Next Topic:", next_topic)
            user.current_topic = next_topic
        else:
            print("No prerequisite")

        if score == 0:
            print("⚠️ Try answering properly or exit with Ctrl+C")

    print("\n🎉 Session Complete!")


if __name__ == "__main__":
    main()