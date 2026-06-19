#!/usr/bin/env python3

"""
SATHEE IIT Kanpur PYQ scraper for JEE topics using requests + BeautifulSoup.

Usage:
  SATHEE_TOPIC_URL_TEMPLATE="https://<host>/pyq?subject={subject}&topic={topic}" \
  python3 scripts/scrape-sathee-pyq.py

Optional env vars:
  OUT_FILE=exam-mode/sathee-scraped-db.js
  REQUEST_DELAY_MS=300
  REQUEST_TIMEOUT_SEC=25

Notes:
- Respect SATHEE terms, robots directives, and request limits.
- URL template must include both {subject} and {topic} placeholders.
- Produces JS output consumed by exam-mode/sathee-question-db.js.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup

TOPIC_MAP: Dict[str, List[str]] = {
    "Physics": [
        "Mechanics",
        "Electromagnetism",
        "Thermodynamics",
        "Optics",
        "Modern Physics",
        "Waves",
        "Kinematics",
    ],
    "Chemistry": [
        "Atomic Structure",
        "Chemical Bonding",
        "Equilibrium",
        "Organic Chemistry",
        "Electrochemistry",
        "Thermochemistry",
        "Chemical Kinetics",
    ],
    "Maths": [
        "Algebra",
        "Calculus",
        "Coordinate Geometry",
        "Probability",
        "Combinatorics",
        "Trigonometry",
        "Vectors and 3D Geometry",
    ],
}

DIFFICULTY_CYCLE = ("easy", "medium", "hard")
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()


def sanitize_id(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9_]", "_", text)


def year_from_text(text: str, default: int = 2024) -> int:
    match = re.search(r"\b(20\d{2})\b", text)
    if not match:
        return default
    year = int(match.group(1))
    return year


def answer_to_letter(value: Any) -> str:
    if isinstance(value, int):
        idx = max(0, min(3, value))
        return ("A", "B", "C", "D")[idx]

    text = clean_text(str(value)).upper()
    if text in ("A", "B", "C", "D"):
        return text
    if text in ("1", "2", "3", "4"):
        return ("A", "B", "C", "D")[int(text) - 1]

    m = re.search(r"\b([A-D]|[1-4])\b", text)
    if m:
        token = m.group(1)
        if token in ("A", "B", "C", "D"):
            return token
        return ("A", "B", "C", "D")[int(token) - 1]

    return "A"


def pad_options(options: List[str]) -> List[str]:
    out = [clean_text(x) for x in options if clean_text(x)]
    out = out[:4]
    while len(out) < 4:
        out.append(f"Option {chr(65 + len(out))}")
    return out


def parse_options_from_text(text: str) -> List[str]:
    normalized = clean_text(text)
    pattern = re.compile(r"\b([A-D])[\)\].:\-]\s*(.+?)(?=\s\b[A-D][\)\].:\-]\s*|$)")
    matches = pattern.findall(normalized)
    return [clean_text(m[1]) for m in matches[:4]]


def extract_question_text(block: Any) -> str:
    selectors = [
        ".question-text",
        ".question",
        ".stem",
        ".q-text",
        "[data-question]",
        "h3",
        "h4",
        "p",
    ]
    for sel in selectors:
        node = block.select_one(sel)
        if node:
            text = clean_text(node.get_text(" ", strip=True))
            if len(text) >= 8:
                return text

    raw = clean_text(block.get_text(" ", strip=True))
    if "Option" in raw:
        raw = raw.split("Option", 1)[0].strip()
    return raw


def extract_options(block: Any) -> List[str]:
    selectors = [
        ".options li",
        ".option",
        ".choices li",
        ".choice",
        "label.option",
        "[data-option]",
        "li",
    ]

    options: List[str] = []
    for sel in selectors:
        items = block.select(sel)
        if not items:
            continue

        options = [clean_text(item.get_text(" ", strip=True)) for item in items]
        options = [o for o in options if len(o) >= 1]
        if len(options) >= 2:
            break

    if len(options) < 2:
        options = parse_options_from_text(block.get_text(" ", strip=True))

    return pad_options(options)


def extract_answer(block: Any) -> str:
    data_attrs = ["data-correct", "data-answer", "data-correct-option", "data-correct-answer"]
    for attr in data_attrs:
        val = block.attrs.get(attr)
        if val is not None:
            return answer_to_letter(val)

    selectors = [
        ".correct-answer",
        ".answer",
        ".solution-answer",
        "[data-correct]",
    ]
    for sel in selectors:
        node = block.select_one(sel)
        if not node:
            continue
        text = node.get_text(" ", strip=True)
        if text:
            m = re.search(r"(?:correct\s*answer|answer)\s*[:\-]?\s*([A-D]|[1-4])", text, re.I)
            if m:
                return answer_to_letter(m.group(1))
            return answer_to_letter(text)

    full = block.get_text(" ", strip=True)
    m = re.search(r"(?:correct\s*answer|answer)\s*[:\-]?\s*([A-D]|[1-4])", full, re.I)
    if m:
        return answer_to_letter(m.group(1))

    return "A"


def extract_difficulty(block: Any, fallback_index: int) -> str:
    raw = clean_text(block.get_text(" ", strip=True)).lower()
    m = re.search(r"\b(easy|medium|hard)\b", raw)
    if m:
        return m.group(1)
    return DIFFICULTY_CYCLE[fallback_index % len(DIFFICULTY_CYCLE)]


def extract_question_blocks(soup: BeautifulSoup) -> List[Any]:
    selectors = [
        ".question-card",
        ".pyq-question",
        "[data-question-id]",
        ".question-item",
        ".question-block",
        ".mcq-question",
    ]
    for sel in selectors:
        blocks = soup.select(sel)
        if blocks:
            return blocks
    return []


def walk_json_nodes(obj: Any) -> Iterable[Dict[str, Any]]:
    if isinstance(obj, dict):
        if (
            obj.get("@type") in {"Question", "Quiz", "QuizQuestion"}
            or "question" in obj
            or "q" in obj
        ):
            yield obj
        for value in obj.values():
            yield from walk_json_nodes(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from walk_json_nodes(value)


def parse_ld_json_records(soup: BeautifulSoup, subject: str, topic: str) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    scripts = soup.find_all("script", attrs={"type": "application/ld+json"})

    for script in scripts:
        text = script.string or script.get_text(" ", strip=True)
        text = clean_text(text)
        if not text:
            continue

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue

        for idx, node in enumerate(walk_json_nodes(data)):
            question = clean_text(str(node.get("question") or node.get("name") or node.get("q") or ""))
            if not question:
                continue

            raw_options = node.get("options") or node.get("answerOptions") or []
            options: List[str] = []
            if isinstance(raw_options, list):
                for item in raw_options:
                    if isinstance(item, dict):
                        options.append(clean_text(str(item.get("text") or item.get("name") or "")))
                    else:
                        options.append(clean_text(str(item)))

            answer = node.get("correctAnswer") or node.get("acceptedAnswer") or "A"
            if isinstance(answer, dict):
                answer = answer.get("text") or answer.get("name") or "A"

            year = year_from_text(
                clean_text(
                    str(node.get("year") or node.get("datePublished") or node.get("publicationYear") or "")
                )
            )

            records.append(
                {
                    "id": sanitize_id(f"SATHEE_{subject}_{topic}_LD_{idx + 1}"),
                    "subject": subject,
                    "topic": topic,
                    "question": question,
                    "options": pad_options(options),
                    "correctAnswer": answer_to_letter(answer),
                    "year": year,
                    "difficulty": DIFFICULTY_CYCLE[idx % len(DIFFICULTY_CYCLE)],
                    "source": "SATHEE",
                }
            )

    return records


def normalize_records(records: List[Dict[str, Any]], subject: str, topic: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for idx, rec in enumerate(records):
        question = clean_text(rec.get("question") or rec.get("q") or "")
        if not question:
            continue

        rec_id = rec.get("id") or sanitize_id(f"SATHEE_{subject}_{topic}_{idx + 1}")
        options = pad_options(rec.get("options") if isinstance(rec.get("options"), list) else [])
        correct = answer_to_letter(rec.get("correctAnswer") or rec.get("correct") or "A")
        year = int(rec.get("year") or year_from_text(question))
        difficulty = clean_text(str(rec.get("difficulty") or DIFFICULTY_CYCLE[idx % len(DIFFICULTY_CYCLE)])).lower()
        if difficulty not in {"easy", "medium", "hard"}:
            difficulty = "medium"

        out.append(
            {
                "id": sanitize_id(str(rec_id)),
                "subject": subject,
                "topic": topic,
                "question": question,
                "options": options,
                "correctAnswer": correct,
                "year": year,
                "difficulty": difficulty,
                "source": "SATHEE",
            }
        )

    deduped: List[Dict[str, Any]] = []
    seen = set()
    for rec in out:
        key = rec["question"].lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(rec)

    return deduped


def parse_topic_page(html: str, subject: str, topic: str) -> List[Dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    parsed: List[Dict[str, Any]] = []

    blocks = extract_question_blocks(soup)
    for idx, block in enumerate(blocks):
        question = extract_question_text(block)
        if not question:
            continue

        parsed.append(
            {
                "id": sanitize_id(f"SATHEE_{subject}_{topic}_{idx + 1}"),
                "subject": subject,
                "topic": topic,
                "question": question,
                "options": extract_options(block),
                "correctAnswer": extract_answer(block),
                "year": year_from_text(block.get_text(" ", strip=True)),
                "difficulty": extract_difficulty(block, idx),
                "source": "SATHEE",
            }
        )

    if not parsed:
        parsed = parse_ld_json_records(soup, subject, topic)

    normalized = normalize_records(parsed, subject, topic)
    return normalized


def dedupe_merged_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    seen = set()
    for rec in records:
        key = (
            clean_text(str(rec.get("subject") or "")),
            clean_text(str(rec.get("topic") or "")),
            clean_text(str(rec.get("question") or "")).lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(rec)
    return out


def build_topic_url(template: str, subject: str, topic: str) -> str:
    return (
        template.replace("{subject}", quote_plus(subject)).replace("{topic}", quote_plus(topic))
    )


def fetch_topic_records(
    session: requests.Session,
    template: str,
    subject: str,
    topic: str,
    timeout_sec: int,
) -> List[Dict[str, Any]]:
    url = build_topic_url(template, subject, topic)
    response = session.get(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout=timeout_sec,
    )
    response.raise_for_status()
    return parse_topic_page(response.text, subject, topic)


def write_output(records: List[Dict[str, Any]], out_file: str) -> None:
    out_path = Path(out_file).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = "window.SATHEE_JEE_SCRAPED_DB = " + json.dumps(records, indent=2) + ";\n"
    out_path.write_text(payload, encoding="utf-8")
    print(f"Wrote {len(records)} normalized records to {out_path}")


def main() -> int:
    template = os.environ.get("SATHEE_TOPIC_URL_TEMPLATE", "").strip()
    if "{subject}" not in template or "{topic}" not in template:
        print(
            "Missing SATHEE_TOPIC_URL_TEMPLATE with {subject} and {topic} placeholders.",
            file=sys.stderr,
        )
        print(
            "Example: SATHEE_TOPIC_URL_TEMPLATE=\"https://example.com/pyq?subject={subject}&topic={topic}\"",
            file=sys.stderr,
        )
        return 1

    out_file = os.environ.get("OUT_FILE", "exam-mode/sathee-scraped-db.js").strip()
    delay_ms = int(os.environ.get("REQUEST_DELAY_MS", "300"))
    timeout_sec = int(os.environ.get("REQUEST_TIMEOUT_SEC", "25"))

    merged: List[Dict[str, Any]] = []
    session = requests.Session()

    for subject, topics in TOPIC_MAP.items():
        for topic in topics:
            print(f"Fetching {subject} -> {topic} ... ", end="", flush=True)
            try:
                topic_records = fetch_topic_records(session, template, subject, topic, timeout_sec)
                if not topic_records:
                    print("no records")
                else:
                    merged.extend(topic_records)
                    print(f"ok ({len(topic_records)})")
            except Exception as exc:
                print(f"failed ({exc})")

            if delay_ms > 0:
                time.sleep(delay_ms / 1000.0)

    if not merged:
        print("No records scraped. Check selectors/template/network and try again.", file=sys.stderr)
        return 1

    write_output(dedupe_merged_records(merged), out_file)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
