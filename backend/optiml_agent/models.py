# models.py

class UserState:
    def __init__(self):
        self.history = []
        self.current_topic = None
        self.domain = None