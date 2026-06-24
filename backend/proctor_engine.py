import cv2
import numpy as np
from ultralytics import YOLO

class ProctorEngine:
    def __init__(self):
        # Initialize OpenCV Face Detection (Haar Cascades)
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Initialize YOLOv8 for object detection (we'll look for cell phones - class 67 in COCO)
        try:
            self.model = YOLO('yolov8n.pt')
        except Exception as e:
            print(f"Failed to load YOLO model: {e}")
            self.model = None

    def analyze_frame(self, frame):
        """
        Analyzes a single frame for proctoring anomalies.
        Returns a dictionary with status and alerts if any.
        """
        alerts = []
        is_violation = False
        
        if frame is None or frame.size == 0:
            return {"status": "error", "alerts": ["Invalid frame received"]}

        # 1. Check for camera block (very low variance/mean usually means blocked or extremely dark)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_val = np.mean(gray)
        variance_val = np.var(gray)
        
        if mean_val < 10 and variance_val < 10:
            alerts.append("Camera blocked or extremely dark environment detected.")
            is_violation = True
            
        # 2. Face Detection
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=8, minSize=(60, 60))
        
        num_faces = len(faces)
            
        if num_faces == 0:
            alerts.append("No face detected in frame.")
            is_violation = True
        elif num_faces > 1:
            alerts.append(f"Multiple faces detected ({num_faces}).")
            is_violation = True
            
        # 3. Cell Phone Detection
        if self.model:
            results_yolo = self.model(frame, verbose=False)
            for result in results_yolo:
                boxes = result.boxes
                for box in boxes:
                    class_id = int(box.cls[0])
                    # COCO class 67 is 'cell phone'
                    if class_id == 67:
                        alerts.append("Cell phone detected.")
                        is_violation = True
                        break # Only need to alert once per frame
                        
        return {
            "status": "violation" if is_violation else "ok",
            "alerts": alerts,
            "terminate_exam": is_violation
        }
