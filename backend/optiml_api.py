from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from optiml_agent.models import UserState
from optiml_agent.agent import LearningAgent

app = FastAPI(title="OptiML Feedback Agent", description="Branch feedback endpoints")

# Allow all origins for seamless integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mocked session store for the API
sessions = {}

@app.post("/start_learning/{session_id}")
def start_learning(session_id: str, domain: str):
    if session_id in sessions:
        user = sessions[session_id]["user"]
        agent = sessions[session_id]["agent"]
    else:
        user = UserState()
        agent = LearningAgent(user)
        sessions[session_id] = {"user": user, "agent": agent}
        
    quiz = agent.generate_initial_quiz(domain)
    return {"quiz": quiz, "domain": domain, "session_id": session_id}

@app.post("/evaluate_quiz/{session_id}")
def evaluate_quiz(session_id: str, answers: list[str], quiz: dict):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    agent = sessions[session_id]["agent"]
    user = sessions[session_id]["user"]
    
    result = agent.evaluate(quiz, answers)
    
    # Logic to progress the curriculum
    topic_scores = result.get("topic_scores", {})
    if topic_scores:
        current_topic = min(topic_scores, key=topic_scores.get)
        user.current_topic = current_topic
    
    # Store history metric
    return {"result": result, "next_topic": user.current_topic}

@app.post("/generate_topic_quiz/{session_id}")
def get_topic_quiz(session_id: str, topic: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    agent = sessions[session_id]["agent"]
    quiz = agent.generate_topic_quiz(topic)
    return {"quiz": quiz}

if __name__ == "__main__":
    port = int(os.environ.get("OPTIML_PORT", 9051))
    print(f"Starting OptiML feedback agent API on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
