# agentic.py

from groq import Groq
import os
import json
import time

try:
    from data import topic_graph
except ImportError:
    from .data import topic_graph

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.1-70b-versatile"
]


class LearningAgent:
    def __init__(self, user):
        self.user = user
        self.asked_questions = set()

    # 🔁 Safe LLM call
    def call_llm(self, prompt):
        for model in MODELS:
            try:
                res = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "Return ONLY JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                print(f"⚡ Using model: {model}")
                return res.choices[0].message.content
            except Exception as e:
                print(f"⚠️ {model} failed:", e)
                time.sleep(1)

        print("🛟 Fallback mode activated")
        return None

    # 🧠 JSON cleaner
    def safe_json(self, text):
        if not text:
            return {}

        text = text.strip()

        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        try:
            return json.loads(text)
        except:
            return {}

    # 🧠 Initial quiz (multi-topic)
    def generate_initial_quiz(self, domain):
        if domain == "math":
            topics = ["algebra", "limits", "differentiation"]
        elif domain == "chemistry":
            topics = ["alkanes", "hydrocarbons", "functional_groups"]
        else:
            topics = ["basic_math", "linear_algebra", "neural_networks"]

        prompt = f"""
Generate 3 MCQ questions.

IMPORTANT:
- Each question from DIFFERENT topic
- Topics: {topics}
- No repetition

Return JSON:
{{
 "questions": [
  {{
    "question": "...",
    "options": ["A. ...","B. ...","C. ...","D. ..."],
    "answer": "A",
    "topic": "alkanes"
  }}
 ]
}}
"""

        text = self.call_llm(prompt)

        if not text:
            return self.fallback_quiz(topics[0])

        return self.safe_json(text)

    # 🧠 Topic quiz
    def generate_topic_quiz(self, topic):
        prompt = f"""
Generate 2 NEW MCQ questions for {topic}.

IMPORTANT:
- No repeated concepts
- Avoid same question
- Must be different from standard examples

Return JSON:
{{
 "questions": [
  {{
    "question": "...",
    "options": ["A. ...","B. ...","C. ...","D. ..."],
    "answer": "A",
    "topic": "{topic}"
  }}
 ]
}}
"""

        text = self.call_llm(prompt)
        data = self.safe_json(text)

        filtered = []
        for q in data.get("questions", []):
            if q["question"] not in self.asked_questions:
                self.asked_questions.add(q["question"])
                filtered.append(q)

        if not filtered:
            return self.fallback_quiz(topic)

        return {"questions": filtered}

    # 📊 Correct evaluation (topic-wise)
    def evaluate(self, quiz, answers):
        feedback = []
        topic_scores = {}
        topic_counts = {}

        for i, q in enumerate(quiz.get("questions", [])):
            topic = q["topic"]

            user_ans = answers[i].strip().upper()
            correct_ans = q["answer"].strip().upper()

            is_correct = user_ans == correct_ans

            topic_counts[topic] = topic_counts.get(topic, 0) + 1
            topic_scores[topic] = topic_scores.get(topic, 0) + (1 if is_correct else 0)

            explanation = (
                "Correct. Good understanding."
                if is_correct
                else f"Incorrect. Correct answer is {correct_ans}. Concept: {topic}"
            )

            feedback.append({
                "question": q["question"],
                "correct_answer": correct_ans,
                "student_answer": user_ans,
                "is_correct": is_correct,
                "explanation": explanation,
                "topic": topic
            })

        for t in topic_scores:
            topic_scores[t] /= topic_counts[t]

        overall_score = sum(topic_scores.values()) / len(topic_scores)

        return {
            "question_feedback": feedback,
            "topic_scores": topic_scores,
            "overall_score": overall_score
        }

    # 🧭 Smart topic movement
    def decide_next_topic(self, topic, score):
        if score < 0.4:
            print("🔻 Weak → prerequisite")
            return topic_graph.get(topic)

        elif score < 0.7:
            print("⚠️ Medium → stay")
            return topic

        else:
            print("✅ Strong → stay/advance later")
            return topic

    # 🛟 fallback
    def fallback_quiz(self, topic):
        return {
            "questions": [
                {
                    "question": f"Basic question on {topic}",
                    "options": ["A", "B", "C", "D"],
                    "answer": "A",
                    "topic": topic
                }
            ]
        }