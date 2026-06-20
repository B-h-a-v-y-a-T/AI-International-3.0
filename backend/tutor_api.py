from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, List, Optional
from fastapi.middleware.cors import CORSMiddleware
from tutor_engine import tutor_engine
import base64
import cv2
import numpy as np
import json

# Try to initialize ProctorEngine (gracefully handle missing packages during setup)
try:
    from proctor_engine import ProctorEngine
    proctor_engine = ProctorEngine()
except Exception as e:
    proctor_engine = None
    print(f"ProctorEngine not loaded: {e}")


# Database integration (silent - no impact if fails)
try:
    import db_helpers as dbh
    DB_AVAILABLE = True
except Exception:
    DB_AVAILABLE = False

app = FastAPI(title="Backend AI Tutor Engine")

# Add standard CORS so it can connect to frontend UI flawlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Strict Input Data Schema Configuration
class StudentInput(BaseModel):
    message: str
    performance: Dict[str, float]
    previous_performance: Optional[Dict[str, float]] = None
    user_id: Optional[str] = "default_user"

# 2. Strict Output Data Schema Configuration
class TutorResponse(BaseModel):
    mood: str
    selected_action: str
    target_concept: str = ""
    reward: float
    weak_concepts: List[str]
    reasoning: str = ""
    next_action: str
    difficulty: str
    mascot_message: str
    explanation: str
    # New intelligence layer fields
    intent: str = ""
    decided_action: str = ""
    variation: str = ""
    allow_videos: bool = True
    # Mood pipeline detail fields
    mood_confidence: float = 0.0
    mood_raw_label: str = ""
    mood_reason: str = ""

@app.post("/process_student_input", response_model=TutorResponse)
def process_student_input(data: StudentInput):
    """
    Unified Endpoint combining sentiment NLP, concept graph traversal, 
    and adaptive learning decision engine structures.
    """
    # Ensure user exists in database (silent)
    if DB_AVAILABLE:
        try:
            dbh.ensure_user_exists(data.user_id)
        except Exception:
            pass
    
    response = tutor_engine(
        data.message, 
        data.performance, 
        data.previous_performance,
        data.user_id
    )
    return response

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE ENDPOINTS (Background features)
# ═══════════════════════════════════════════════════════════════════════════════

class QuizResultInput(BaseModel):
    user_id: str
    quiz_id: str
    results: List[Dict]

@app.post("/log_quiz")
def log_quiz(data: QuizResultInput):
    """Log quiz results for performance tracking."""
    if not DB_AVAILABLE:
        return {"status": "disabled", "message": "Database not available"}
    
    try:
        dbh.log_quiz_completion(data.user_id, data.quiz_id, data.results)
        return {"status": "success", "message": "Quiz logged successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class PerformanceInput(BaseModel):
    user_id: str
    topic: str
    score: float

@app.post("/log_performance")
def log_performance(data: PerformanceInput):
    """Log topic performance."""
    if not DB_AVAILABLE:
        return {"status": "disabled"}
    
    try:
        dbh.log_topic_performance(data.user_id, data.topic, data.score)
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/learning_recommendations/{user_id}")
def get_recommendations(user_id: str):
    """Get personalized learning recommendations."""
    if not DB_AVAILABLE:
        return {"has_data": False, "prioritized_topics": [], "weak_areas": []}
    
    try:
        return dbh.get_learning_recommendations(user_id)
    except Exception:
        return {"has_data": False, "prioritized_topics": [], "weak_areas": []}

@app.get("/user_analytics/{user_id}")
def get_analytics(user_id: str):
    """Get user analytics (internal use)."""
    if not DB_AVAILABLE:
        return {"has_data": False}
    
    try:
        return dbh.get_user_analytics(user_id)
    except Exception:
        return {"has_data": False}

# To boot server manually: uvicorn tutor_api:app --host 0.0.0.0 --port 8050

# Helper function to decode base64 images to OpenCV format
def base64_to_cv2(base64_string):
    """Decodes the JS base64 image into an OpenCV format"""
    # Remove the "data:image/jpeg;base64," prefix from the frontend
    encoded_data = base64_string.split(',')[1]
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

@app.websocket("/ws/proctor")
async def websocket_proctor_endpoint(websocket: WebSocket):
    await websocket.accept()
    if proctor_engine is None:
        print("ProctorEngine is not initialized.")
        await websocket.close(code=1011, reason="ProctorEngine not initialized")
        return
    try:
        while True:
            data = await websocket.receive_text()
            json_data = json.loads(data)
            
            # 1. Decode image
            frame = base64_to_cv2(json_data['image'])
            
            # 2. Run AI Analysis
            result = proctor_engine.analyze_frame(frame)
            
            # 3. Send results back to the browser
            await websocket.send_json(result)
            
    except WebSocketDisconnect:
        print("Student disconnected from proctoring socket.")
    except Exception as e:
        print(f"Error in proctoring socket: {e}")