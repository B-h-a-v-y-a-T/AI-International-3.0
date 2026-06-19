import random
from typing import Dict, List

# ═══════════════════════════════════════════════════════════════════════════════
# ORIGINAL BANDIT — PRESERVED UNCHANGED
# ═══════════════════════════════════════════════════════════════════════════════

# Define the set of possible teaching actions (ORIGINAL)
ACTIONS = [
    "revise_basics",
    "easy_question",
    "medium_question",
    "advance_topic"
]

# In-memory storage for Q-values and action selection counts
# This enables state persistence across API calls without a DB
Q_VALUES = {action: 0.0 for action in ACTIONS}
ACTION_COUNTS = {action: 0 for action in ACTIONS}

# Hyperparameters for the Multi-Armed Bandit
EPSILON = 0.2  # Exploration probability (20% chance to try a random action)
ALPHA = 0.1    # Learning rate (how much new rewards overwrite old ones)

def select_action() -> str:
    """
    Selects the next teaching action using an epsilon-greedy strategy.
    Balances exploration of new teaching methods vs exploitation of known good ones.
    """
    if random.random() < EPSILON:
        # Explore: pick a completely random action
        return random.choice(ACTIONS)
    else:
        # Exploit: pick the action with the highest Q-value
        max_q = max(Q_VALUES.values())
        # Support tie-breaking randomly if multiple actions have the exact same max Q
        best_actions = [a for a, q in Q_VALUES.items() if q == max_q]
        return random.choice(best_actions)

def compute_reward(current_perf: Dict[str, float], previous_perf: Dict[str, float], risk_score: float) -> float:
    """
    Computes a continuous reward signal bounded between -1.0 and 1.0.
    Reward = Performance Delta - Risk Score
    """
    if not current_perf or not previous_perf:
        return 0.0
        
    avg_current = sum(current_perf.values()) / len(current_perf)
    avg_prev = sum(previous_perf.values()) / len(previous_perf)
    
    # 1. Calculate performance improvement delta
    # Divide by a scaling factor (e.g. 20) so a +20% jump yields a +1.0 base reward component
    perf_delta = (avg_current - avg_prev) / 20.0 
    
    # 2. Subtract the sentiment/risk score penalty directly
    reward = perf_delta - risk_score
    
    # Normalize securely to remain structurally sane between [-1.0, 1.0]
    return max(-1.0, min(1.0, float(reward)))

def update_q_value(action: str, reward: float):
    """
    Online learning Q-value update rule.
    Q[action] = Q[action] + alpha * (reward - Q[action])
    """
    ACTION_COUNTS[action] += 1
    current_q = Q_VALUES[action]
    Q_VALUES[action] = current_q + ALPHA * (reward - current_q)

def get_action_details(action: str, weak_concepts: List[str]) -> Dict[str, str]:
    """
    Maps dynamic MAB actions back into structured UI/Tutor behaviors.
    """
    target_concept = weak_concepts[-1] if weak_concepts else "the current topic"
    
    mapping = {
        "revise_basics": {
            "difficulty": "easy",
            "mascot_message": "Let's take a deep breath and review the foundations together.",
            "explanation": f"Suggesting a basic foundational review of {target_concept}."
        },
        "easy_question": {
            "difficulty": "easy",
            "mascot_message": "Let's start with a simpler question to build your confidence.",
            "explanation": f"Providing an introductory problem focused on {target_concept}."
        },
        "medium_question": {
            "difficulty": "medium",
            "mascot_message": "You can do this. Let's try a standard problem.",
            "explanation": f"Generating a standard practice question on {target_concept}."
        },
        "advance_topic": {
            "difficulty": "hard",
            "mascot_message": "You're doing absolutely great, let's take it up a notch!",
            "explanation": f"Moving to advanced level applications of {target_concept}."
        }
    }
    
    return mapping.get(action, mapping["medium_question"])


# ═══════════════════════════════════════════════════════════════════════════════
# NEW: VARIATION SELECTION — Bandit selects WITHIN a decided action
# ═══════════════════════════════════════════════════════════════════════════════

# Separate Q-values for variations (independent from original ACTIONS)
VARIATION_Q_VALUES: Dict[str, float] = {}
VARIATION_COUNTS: Dict[str, int] = {}

def select_variation(variation_pool: List[str]) -> str:
    """
    Uses epsilon-greedy to select a variation from the given pool.
    Each variation has its own Q-value that learns over time.

    This allows the bandit to learn which TONE/STYLE works best
    within each action type, rather than choosing the action itself.
    """
    if not variation_pool:
        return "default"

    # Initialize Q-values for any new variations
    for v in variation_pool:
        if v not in VARIATION_Q_VALUES:
            VARIATION_Q_VALUES[v] = 0.0
            VARIATION_COUNTS[v] = 0

    if random.random() < EPSILON:
        # Explore: random variation
        return random.choice(variation_pool)
    else:
        # Exploit: pick the variation with the highest Q-value from this pool
        pool_q = {v: VARIATION_Q_VALUES[v] for v in variation_pool}
        max_q = max(pool_q.values())
        best = [v for v, q in pool_q.items() if q == max_q]
        return random.choice(best)


def update_variation_q(variation: str, reward: float):
    """
    Updates the Q-value for a specific variation.
    Same learning rule as the original bandit.
    """
    if variation not in VARIATION_Q_VALUES:
        VARIATION_Q_VALUES[variation] = 0.0
        VARIATION_COUNTS[variation] = 0

    VARIATION_COUNTS[variation] += 1
    current_q = VARIATION_Q_VALUES[variation]
    VARIATION_Q_VALUES[variation] = current_q + ALPHA * (reward - current_q)
