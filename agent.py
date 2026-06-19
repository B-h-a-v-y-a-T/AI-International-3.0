"""
Central Agentic AI Tutor decision module.

Provides:
- get_agent_decision(user_state, context)
- helper logic to maintain user_state from quiz events
- Groq LLM call with strict JSON parsing and rule-based fallback
"""

from __future__ import annotations

import json
import math
import os
import re
import urllib.error
import urllib.request
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

ALLOWED_ACTIONS = {"revise", "practice", "advance"}
ALLOWED_DIFFICULTIES = {"easy", "medium", "hard"}
ALLOWED_CONTEXTS = {"dashboard", "learning", "resources", "revision", "chat"}

TOPIC_UNIVERSE_BY_EXAM: Dict[str, List[str]] = {
    "JEE": [
        "kinematics",
        "laws of motion",
        "work energy power",
        "thermodynamics",
        "electrostatics",
        "calculus",
        "probability",
        "organic chemistry",
        "chemical bonding",
    ],
    "NEET": [
        "cell biology",
        "genetics",
        "human physiology",
        "photosynthesis",
        "thermodynamics",
        "electrostatics",
        "organic chemistry",
        "chemical bonding",
    ],
    "CAT": [
        "arithmetic",
        "algebra",
        "geometry",
        "number system",
        "probability",
        "data interpretation",
        "logical reasoning",
        "reading comprehension",
    ],
}

SUBJECT_TOPIC_MAP: Dict[str, List[str]] = {
    "physics": ["kinematics", "laws of motion", "work energy power", "thermodynamics", "electrostatics"],
    "chemistry": ["organic chemistry", "chemical bonding", "thermodynamics"],
    "math": ["calculus", "probability", "algebra", "geometry"],
    "maths": ["calculus", "probability", "algebra", "geometry"],
    "biology": ["cell biology", "genetics", "human physiology", "photosynthesis"],
    "qa": ["arithmetic", "algebra", "number system", "probability"],
    "dilr": ["data interpretation", "logical reasoning"],
    "varc": ["reading comprehension"],
}


def _normalize_topic(topic: Any) -> str:
    value = str(topic or "").strip().lower()
    value = value.replace("_", " ").replace("-", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _display_topic(topic: Any) -> str:
    clean = _normalize_topic(topic)
    if not clean:
        return "General Concepts"
    return " ".join(word[:1].upper() + word[1:] for word in clean.split(" "))


def _clamp01(value: Any, default: float = 0.5) -> float:
    try:
        num = float(value)
    except (TypeError, ValueError):
        return default
    return max(0.0, min(1.0, num))


def _mean(values: List[float], default: float = 0.0) -> float:
    if not values:
        return default
    return sum(values) / len(values)


def _dedupe_topics(topics: List[Any]) -> List[str]:
    out: List[str] = []
    seen = set()
    for topic in topics:
        t = _normalize_topic(topic)
        if not t or t in seen:
            continue
        seen.add(t)
        out.append(t)
    return out


def detect_trend(recent_scores: List[float]) -> str:
    if len(recent_scores) < 3:
        return "unknown"

    y = [_clamp01(v) for v in recent_scores]
    n = len(y)
    x = list(range(n))

    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(i * yi for i, yi in zip(x, y))
    sum_x2 = sum(i * i for i in x)
    den = n * sum_x2 - sum_x * sum_x
    slope = 0.0 if den == 0 else (n * sum_xy - sum_x * sum_y) / den

    diffs = [y[i] - y[i - 1] for i in range(1, n)]
    sign_changes = 0
    for i in range(1, len(diffs)):
        if abs(diffs[i]) > 0.05 and abs(diffs[i - 1]) > 0.05 and (diffs[i] > 0) != (diffs[i - 1] > 0):
            sign_changes += 1

    if len(diffs) >= 3 and sign_changes >= len(diffs) // 2:
        return "fluctuating"
    if slope > 0.03:
        return "improving"
    if slope < -0.03:
        return "declining"
    return "stable"


def compute_confidence(recent_scores: List[float]) -> str:
    if len(recent_scores) < 2:
        return "medium"

    vals = [_clamp01(v) for v in recent_scores]
    avg = _mean(vals, 0.5)
    variance = _mean([(v - avg) ** 2 for v in vals], 0.0)
    std_dev = math.sqrt(variance)

    if std_dev < 0.1 and avg >= 0.6:
        return "high"
    if std_dev > 0.2 or avg < 0.35:
        return "low"
    return "medium"


def extract_weak_topics(quiz_results: List[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
    stats: Dict[str, Dict[str, int]] = {}
    for result in quiz_results:
        topic = _normalize_topic(result.get("topic") or result.get("concept") or "general")
        if not topic:
            continue
        stats.setdefault(topic, {"correct": 0, "total": 0})
        stats[topic]["total"] += 1
        if bool(result.get("correct")):
            stats[topic]["correct"] += 1

    weak: List[str] = []
    strong: List[str] = []
    for topic, s in stats.items():
        acc = (s["correct"] / s["total"]) if s["total"] else 0.0
        if acc < 0.5:
            weak.append(topic)
        elif acc >= 0.8:
            strong.append(topic)

    return weak, strong


def _build_topic_universe(user_state: Dict[str, Any]) -> List[str]:
    exam = str(user_state.get("exam") or "JEE").upper()
    base = TOPIC_UNIVERSE_BY_EXAM.get(exam, TOPIC_UNIVERSE_BY_EXAM["JEE"])

    inferred_subject_topics: List[str] = []
    for subject in (user_state.get("scores") or {}).keys():
        key = _normalize_topic(subject)
        inferred_subject_topics.extend(SUBJECT_TOPIC_MAP.get(key, []))

    history_topics: List[str] = []
    for row in user_state.get("quiz_history", []) or []:
        if isinstance(row, dict):
            t = _normalize_topic(row.get("topic"))
            if t:
                history_topics.append(t)
            for m in row.get("mistakes", []) or []:
                if isinstance(m, dict):
                    mt = _normalize_topic(m.get("topic") or m.get("concept"))
                    if mt:
                        history_topics.append(mt)

    return _dedupe_topics(
        list(user_state.get("weak_topics") or [])
        + list(user_state.get("strong_topics") or [])
        + inferred_subject_topics
        + list((user_state.get("bandit") or {}).keys())
        + history_topics
        + base
    ) or ["general concepts", "problem solving", "fundamentals"]


def _topic_vector(text: str) -> Dict[str, float]:
    tokens = [t for t in _normalize_topic(text).split(" ") if len(t) > 2]
    vec: Dict[str, float] = {}
    for token in tokens:
        vec[token] = vec.get(token, 0.0) + 1.0
    norm = math.sqrt(sum(v * v for v in vec.values()))
    if norm > 0:
        for key in list(vec.keys()):
            vec[key] = vec[key] / norm
    return vec


def _cosine_sparse(a: Dict[str, float], b: Dict[str, float]) -> float:
    if not a or not b:
        return 0.0
    if len(a) > len(b):
        a, b = b, a
    return sum(v * b.get(k, 0.0) for k, v in a.items())


def _nearest_topics(query_topic: str, candidates: List[str], limit: int = 3) -> List[Tuple[str, float]]:
    qv = _topic_vector(query_topic)
    scored = [(c, _cosine_sparse(qv, _topic_vector(c))) for c in _dedupe_topics(candidates)]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[: max(1, limit)]


def _pick_bandit_topic(user_state: Dict[str, Any], context: str) -> Dict[str, Any]:
    bandit = user_state.get("bandit") or {}
    weak = set(_dedupe_topics(user_state.get("weak_topics") or []))
    strong = set(_dedupe_topics(user_state.get("strong_topics") or []))
    candidates = _build_topic_universe(user_state)

    total_shown = 0
    for topic in candidates:
        node = bandit.get(topic) or {}
        total_shown += int(node.get("shown") or 0)

    best_topic = candidates[0]
    best_score = -1e9

    for topic in candidates:
        node = bandit.get(topic) or {}
        shown = max(0, int(node.get("shown") or 0))
        reward = _clamp01(node.get("reward"), 0.5)

        negative_pressure = 1.0 - reward
        novelty = 1.0 if shown == 0 else math.sqrt(math.log(total_shown + len(candidates) + 1.0) / (shown + 1.0))
        weak_pressure = 1.0 if topic in weak else 0.0
        unseen_bonus = 1.0 if shown == 0 else 0.0

        score = (0.42 * negative_pressure) + (0.28 * novelty) + (0.2 * weak_pressure) + (0.1 * unseen_bonus)
        if topic in strong:
            score -= 0.15
        if context == "resources" and topic in weak:
            score += 0.05

        if score > best_score:
            best_score = score
            best_topic = topic

    return {
        "topic": best_topic,
        "score": round(best_score, 4),
        "total_candidates": len(candidates),
    }


def _resolve_topic(raw_topic: Any, user_state: Dict[str, Any], context: str) -> Dict[str, Any]:
    universe = _build_topic_universe(user_state)
    bandit_pick = _pick_bandit_topic(user_state, context)
    normalized_raw = _normalize_topic(raw_topic)

    resolved = bandit_pick["topic"]
    if normalized_raw:
        if normalized_raw in universe:
            resolved = normalized_raw
        else:
            near = _nearest_topics(normalized_raw, universe, limit=3)
            if near and near[0][1] >= 0.42:
                resolved = near[0][0]
            elif normalized_raw not in {"general", "general concepts", "mixed", "overall"}:
                resolved = normalized_raw

    mapped = [_display_topic(topic) for topic, _ in _nearest_topics(resolved, universe, limit=3)]
    return {
        "topic": _display_topic(resolved),
        "mapped_topics": mapped,
        "bandit": bandit_pick,
    }


def _build_default_user_state() -> Dict[str, Any]:
    return {
        "scores": {},
        "weak_topics": [],
        "strong_topics": [],
        "streak": 0,
        "recent_scores": [],
        "current_subject": "",
        "exam": "JEE",
        "last_action": None,
        "trend": "unknown",
        "confidence": "medium",
        "quiz_history": [],
        "bandit": {},
    }


def build_user_state(
    user_state: Optional[Dict[str, Any]] = None,
    stored_state: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    defaults = _build_default_user_state()
    client = user_state or {}
    stored = stored_state or {}

    stored_history = list(stored.get("quiz_history") or [])
    client_history = list(client.get("quiz_history") or [])
    history = (stored_history + client_history)[-80:]

    stored_recent = [_clamp01(v) for v in (stored.get("recent_scores") or [])][-10:]
    client_recent = [_clamp01(v) for v in (client.get("recent_scores") or [])][-10:]
    history_recent = [_clamp01(row.get("score"), 0.5) for row in history if isinstance(row, dict)][-10:]
    recent = client_recent or stored_recent or history_recent

    scores: Dict[str, int] = {}
    for src in (stored.get("scores") or {}, client.get("scores") or {}):
        for k, v in src.items():
            try:
                scores[k] = int(round(float(v)))
            except (TypeError, ValueError):
                continue

    if not scores and history:
        by_subject: Dict[str, List[int]] = {}
        for row in history:
            if not isinstance(row, dict):
                continue
            subject = _normalize_topic(row.get("subject") or row.get("topic") or "general")
            by_subject.setdefault(subject, []).append(int(round(_clamp01(row.get("score")) * 100)))
        for subject, vals in by_subject.items():
            scores[subject] = int(round(sum(vals) / len(vals)))

    weak_topics = _dedupe_topics(list(stored.get("weak_topics") or []) + list(client.get("weak_topics") or []))
    strong_topics = _dedupe_topics(list(stored.get("strong_topics") or []) + list(client.get("strong_topics") or []))

    bandit: Dict[str, Dict[str, Any]] = {}
    for src in (stored.get("bandit") or {}, client.get("bandit") or {}):
        for raw_topic, node in src.items():
            topic = _normalize_topic(raw_topic)
            if not topic:
                continue
            prev = bandit.get(topic, {"shown": 0, "reward": 0.5, "last_seen": None})
            shown = int(prev.get("shown", 0)) + int((node or {}).get("shown") or 0)
            reward_prev = _clamp01(prev.get("reward"), 0.5)
            reward_new = _clamp01((node or {}).get("reward"), 0.5)
            reward = reward_new if shown <= 0 else ((reward_prev + reward_new) / 2.0)
            bandit[topic] = {
                "shown": shown,
                "reward": round(reward, 4),
                "last_seen": (node or {}).get("last_seen") or prev.get("last_seen"),
            }

    built = {
        **defaults,
        "scores": scores,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "streak": max(int(stored.get("streak") or 0), int(client.get("streak") or 0)),
        "recent_scores": recent,
        "current_subject": str(client.get("current_subject") or stored.get("current_subject") or "").strip(),
        "exam": str(client.get("exam") or stored.get("exam") or "JEE").strip() or "JEE",
        "last_action": (str(client.get("last_action") or stored.get("last_action") or "").strip() or None),
        "quiz_history": history,
        "bandit": bandit,
    }

    if not built["weak_topics"] or not built["strong_topics"]:
        rows: List[Dict[str, Any]] = []
        for q in built["quiz_history"]:
            if not isinstance(q, dict):
                continue
            t = _normalize_topic(q.get("topic"))
            if t:
                rows.append({"topic": t, "correct": _clamp01(q.get("score")) >= 0.8})
            for m in q.get("mistakes", []) or []:
                if isinstance(m, dict):
                    mt = _normalize_topic(m.get("topic") or m.get("concept"))
                    if mt:
                        rows.append({"topic": mt, "correct": False})
        w, s = extract_weak_topics(rows)
        if not built["weak_topics"]:
            built["weak_topics"] = w
        if not built["strong_topics"]:
            built["strong_topics"] = s

    built["trend"] = detect_trend(built["recent_scores"])
    built["confidence"] = compute_confidence(built["recent_scores"])
    return built


def update_recent_scores(user_state: Dict[str, Any], latest_score: float, max_len: int = 10) -> Dict[str, Any]:
    recent = list(user_state.get("recent_scores") or [])
    recent.append(_clamp01(latest_score))
    user_state["recent_scores"] = recent[-max_len:]
    user_state["trend"] = detect_trend(user_state["recent_scores"])
    user_state["confidence"] = compute_confidence(user_state["recent_scores"])
    return user_state


def update_user_state_from_quiz(
    user_state: Dict[str, Any],
    subject: str,
    topic: str,
    score: float,
    mistakes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    mistakes = mistakes or []
    state = build_user_state(user_state)

    subj = _normalize_topic(subject) or "general"
    top = _normalize_topic(topic or subj) or "general concepts"
    score01 = _clamp01(score)

    history = list(state.get("quiz_history") or [])
    history.append(
        {
            "subject": subj,
            "topic": top,
            "score": score01,
            "mistakes": mistakes,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    )
    state["quiz_history"] = history[-80:]

    current_subject_scores = [
        _clamp01(row.get("score"))
        for row in state["quiz_history"]
        if isinstance(row, dict) and _normalize_topic(row.get("subject")) == subj
    ]
    state.setdefault("scores", {})[subj] = int(round(_mean(current_subject_scores, score01) * 100))

    update_recent_scores(state, score01, max_len=10)

    events: List[Dict[str, Any]] = []
    for row in state["quiz_history"]:
        if not isinstance(row, dict):
            continue
        t = _normalize_topic(row.get("topic"))
        if t:
            events.append({"topic": t, "correct": _clamp01(row.get("score")) >= 0.8})
        for m in row.get("mistakes", []) or []:
            if isinstance(m, dict):
                mt = _normalize_topic(m.get("topic") or m.get("concept"))
                if mt:
                    events.append({"topic": mt, "correct": False})

    weak, strong = extract_weak_topics(events)
    state["weak_topics"] = weak
    state["strong_topics"] = strong

    bandit = dict(state.get("bandit") or {})
    touched = _dedupe_topics([top] + [_normalize_topic(m.get("topic") or m.get("concept")) for m in mistakes if isinstance(m, dict)])
    for t in touched:
        node = dict(bandit.get(t) or {"shown": 0, "reward": 0.5})
        shown = int(node.get("shown") or 0)
        old_reward = _clamp01(node.get("reward"), 0.5)
        observed = score01 if t == top else 0.2
        new_reward = (0.7 * old_reward) + (0.3 * observed)
        bandit[t] = {
            "shown": shown + 1,
            "reward": round(new_reward, 4),
            "last_seen": datetime.utcnow().isoformat() + "Z",
        }
    state["bandit"] = bandit

    return state


def _fallback_decision(user_state: Dict[str, Any], context: str) -> Dict[str, Any]:
    state = build_user_state(user_state)
    recent = state.get("recent_scores") or [0.5]
    avg = _mean([_clamp01(s) for s in recent], 0.5)

    if avg < 0.4:
        action = "revise"
        difficulty = "easy"
    elif avg <= 0.8:
        action = "practice"
        difficulty = "medium"
    else:
        action = "advance"
        difficulty = "hard"

    trend = state.get("trend") or detect_trend(recent)
    confidence = state.get("confidence") or compute_confidence(recent)

    if trend == "declining" and action == "advance":
        action = "practice"
        difficulty = "medium"
    if trend == "fluctuating":
        action = "practice"
        difficulty = "medium"
    if confidence == "low" and difficulty == "hard":
        difficulty = "medium"

    if state.get("last_action") == action:
        if action == "revise":
            action = "practice"
            difficulty = "easy"
        elif action == "advance":
            action = "practice"
            difficulty = "medium"
        else:
            action = "advance" if trend == "improving" else "revise"
            difficulty = "medium" if action == "advance" else "easy"

    topic_info = _resolve_topic((state.get("weak_topics") or [None])[0], state, context)
    topic = topic_info["topic"]

    if action == "revise":
        insight = f"{topic} needs revision to rebuild core understanding."
        reason = f"Average recent score is {round(avg * 100)}%, below the revision threshold."
    elif action == "practice":
        insight = f"Practice on {topic} will improve your consistency now."
        reason = f"Average recent score is {round(avg * 100)}%, so focused practice is optimal."
    else:
        insight = f"You are ready to advance with harder work in {topic}."
        reason = f"Average recent score is {round(avg * 100)}%, above the advancement threshold."

    return {
        "insight": insight,
        "action": action,
        "reason": reason,
        "recommended_topic": topic,
        "difficulty": difficulty,
        "trend": trend,
        "confidence": confidence,
        "mapped_topics": topic_info["mapped_topics"],
        "bandit": topic_info["bandit"],
        "source": "rule-fallback",
    }


def _clean_llm_json(raw_text: str) -> Dict[str, Any]:
    cleaned = (raw_text or "").strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned, re.IGNORECASE)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    obj_match = re.search(r"\{[\s\S]*\}", cleaned)
    if not obj_match:
        raise ValueError("No JSON object found in LLM response")

    payload = obj_match.group(0)
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        sanitized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", payload)
        sanitized = sanitized.replace("\r\n", " ").replace("\n", " ").replace("\r", " ").replace("\t", " ")
        return json.loads(sanitized)


def _build_prompt(user_state: Dict[str, Any], context: str) -> str:
    context_map = {
        "dashboard": "Student is on dashboard overview. Give direct next action.",
        "learning": "Student is on learning path. Decide revisit vs forward step.",
        "resources": "Student is on resources page. Recommend highest-impact topic now.",
        "revision": "Student is revising now. Point exact weak-focus area.",
        "chat": "Student asked for a plan in tutor chat. Keep it structured and actionable.",
    }

    bandit_topic = _pick_bandit_topic(user_state, context)["topic"]

    return (
        "You are a central agentic tutor decision engine. Return ONLY strict JSON.\n\n"
        f"CONTEXT: {context}\n"
        f"CONTEXT_GUIDE: {context_map.get(context, context_map['dashboard'])}\n"
        f"scores: {json.dumps(user_state.get('scores', {}), ensure_ascii=True)}\n"
        f"weak_topics: {json.dumps(user_state.get('weak_topics', []), ensure_ascii=True)}\n"
        f"strong_topics: {json.dumps(user_state.get('strong_topics', []), ensure_ascii=True)}\n"
        f"recent_scores: {json.dumps(user_state.get('recent_scores', []), ensure_ascii=True)}\n"
        f"streak: {int(user_state.get('streak') or 0)}\n"
        f"trend: {user_state.get('trend', 'unknown')}\n"
        f"confidence: {user_state.get('confidence', 'medium')}\n"
        f"last_action: {user_state.get('last_action')}\n"
        f"exam: {user_state.get('exam', 'JEE')}\n"
        f"bandit_topic: {bandit_topic}\n\n"
        "Rules:\n"
        "1) avg score < 0.4 => action revise\n"
        "2) avg score 0.4-0.8 => action practice\n"
        "3) avg score > 0.8 => action advance\n"
        "4) Use bandit behavior: prioritize weak/negative topics and also unseen topics.\n"
        "5) Always explain why.\n\n"
        "Return exactly:\n"
        "{\n"
        '  "insight": "...",\n'
        '  "action": "revise|practice|advance",\n'
        '  "reason": "...",\n'
        '  "recommended_topic": "...",\n'
        '  "difficulty": "easy|medium|hard"\n'
        "}"
    )


def _call_groq(prompt: str, timeout_seconds: float = 6.0) -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 300,
    }

    req = urllib.request.Request(
        url="https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Groq HTTP {exc.code}: {err_body[:200]}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Groq URL error: {exc.reason}") from exc

    parsed = json.loads(body)
    return ((parsed.get("choices") or [{}])[0].get("message") or {}).get("content") or ""


def get_agent_decision(user_state: Dict[str, Any], context: str) -> Dict[str, Any]:
    """
    Central decision API for the tutor layer.

    Input:
      user_state: dynamic learner state dict
      context: one of dashboard|learning|resources|revision|chat

    Output (strict keys):
      {
        "insight": str,
        "action": "revise"|"practice"|"advance",
        "reason": str,
        "recommended_topic": str,
        "difficulty": "easy"|"medium"|"hard"
      }
    """
    safe_context = context if context in ALLOWED_CONTEXTS else "dashboard"
    state = build_user_state(user_state)
    fallback = _fallback_decision(state, safe_context)

    try:
        prompt = _build_prompt(state, safe_context)
        raw = _call_groq(prompt)
        decision = _clean_llm_json(raw)

        action = str(decision.get("action") or "").strip().lower()
        difficulty = str(decision.get("difficulty") or "").strip().lower()

        if action not in ALLOWED_ACTIONS:
            action = fallback["action"]
        if difficulty not in ALLOWED_DIFFICULTIES:
            difficulty = fallback["difficulty"]

        topic_info = _resolve_topic(decision.get("recommended_topic"), state, safe_context)

        final = {
            "insight": str(decision.get("insight") or fallback["insight"]).strip(),
            "action": action,
            "reason": str(decision.get("reason") or fallback["reason"]).strip(),
            "recommended_topic": topic_info["topic"],
            "difficulty": difficulty,
            "trend": state.get("trend", "unknown"),
            "confidence": state.get("confidence", "medium"),
            "mapped_topics": topic_info["mapped_topics"],
            "bandit": topic_info["bandit"],
            "source": "groq-ai",
        }

        if not final["insight"] or not final["reason"]:
            return fallback
        return final

    except Exception:
        return fallback


if __name__ == "__main__":
    sample_state = {
        "scores": {"physics": 84, "chemistry": 71, "math": 91},
        "weak_topics": ["thermodynamics", "organic reactions"],
        "strong_topics": ["algebra"],
        "streak": 14,
        "recent_scores": [0.6, 0.7, 0.5],
        "exam": "JEE",
    }
    print(json.dumps(get_agent_decision(sample_state, "dashboard"), indent=2))
