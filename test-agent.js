// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATED TEST SUITE — Agent Decision Engine
// Tests trend detection, confidence, action deduplication, and all contexts.
// Run: node test-agent.js
// ═══════════════════════════════════════════════════════════════════════════════

const BASE = process.env.BASE_URL || 'http://localhost:5050';
let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
  }
}

async function postAgent(userState, context) {
  const res = await fetch(`${BASE}/api/agent/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_state: userState, context }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function postUserState(data) {
  const res = await fetch(`${BASE}/api/agent/user-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchPage(path) {
  const res = await fetch(`${BASE}/${path}`);
  return { status: res.status, body: await res.text() };
}

// ── Test Suite ───────────────────────────────────────────────────────────────

async function run() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  AGENT DECISION ENGINE — AUTOMATED TESTS');
  console.log('═══════════════════════════════════════════\n');

  // ── 1. API Health & Response Shape ──
  console.log('📦 1. API HEALTH & RESPONSE SHAPE');
  {
    const d = await postAgent(
      { scores: { physics: 50 }, weak_topics: ['optics'], strong_topics: [], streak: 5, recent_scores: [0.5, 0.5, 0.5] },
      'dashboard'
    );
    assert(d.insight && typeof d.insight === 'string', 'insight is a non-empty string');
    assert(['revise', 'practice', 'advance'].includes(d.action), `action is valid: "${d.action}"`);
    assert(d.reason && typeof d.reason === 'string', 'reason is a non-empty string');
    assert(d.recommended_topic && typeof d.recommended_topic === 'string', `recommended_topic present: "${d.recommended_topic}"`);
    assert(['easy', 'medium', 'hard'].includes(d.difficulty), `difficulty is valid: "${d.difficulty}"`);
    assert(['groq-ai', 'rule-fallback'].includes(d.source), `source is valid: "${d.source}"`);
    assert(d.trend !== undefined, `trend field present: "${d.trend}"`);
    assert(d.confidence !== undefined, `confidence field present: "${d.confidence}"`);
  }

  // ── 2. Score-Based Decisions ──
  console.log('\n📊 2. SCORE-BASED DECISIONS');
  {
    // Weak student
    const weak = await postAgent(
      { scores: { physics: 30 }, weak_topics: ['thermodynamics'], strong_topics: [], streak: 2, recent_scores: [0.2, 0.3, 0.25] },
      'dashboard'
    );
    assert(weak.action === 'revise', `weak student → revise (got: ${weak.action})`);
    assert(weak.difficulty === 'easy' || weak.difficulty === 'medium', `weak student → easy/medium difficulty (got: ${weak.difficulty})`);

    // Medium student
    const mid = await postAgent(
      { scores: { physics: 60 }, weak_topics: ['waves'], strong_topics: [], streak: 7, recent_scores: [0.55, 0.6, 0.65] },
      'dashboard'
    );
    assert(mid.action === 'practice', `medium student → practice (got: ${mid.action})`);
    assert(mid.difficulty === 'medium', `medium student → medium difficulty (got: ${mid.difficulty})`);

    // Strong student
    const strong = await postAgent(
      { scores: { physics: 95, chemistry: 88 }, weak_topics: [], strong_topics: ['mechanics'], streak: 20, recent_scores: [0.85, 0.9, 0.92, 0.88] },
      'dashboard'
    );
    assert(strong.action === 'advance' || strong.action === 'practice', `strong student → advance or practice (got: ${strong.action})`);
  }

  // ── 3. Trend Detection ──
  console.log('\n📈 3. TREND DETECTION');
  {
    // Improving trend
    const improving = await postAgent(
      { scores: { math: 70 }, weak_topics: ['calculus'], strong_topics: [], streak: 10, recent_scores: [0.4, 0.5, 0.6, 0.7, 0.75] },
      'dashboard'
    );
    assert(improving.trend === 'improving', `improving scores detected as "improving" (got: ${improving.trend})`);

    // Declining trend
    const declining = await postAgent(
      { scores: { physics: 60 }, weak_topics: ['optics'], strong_topics: [], streak: 5, recent_scores: [0.8, 0.7, 0.6, 0.5, 0.4] },
      'dashboard'
    );
    assert(declining.trend === 'declining', `declining scores detected as "declining" (got: ${declining.trend})`);

    // Fluctuating trend
    const fluct = await postAgent(
      { scores: { chemistry: 55 }, weak_topics: ['bonds'], strong_topics: [], streak: 8, recent_scores: [0.4, 0.8, 0.3, 0.7, 0.4, 0.8] },
      'dashboard'
    );
    assert(fluct.trend === 'fluctuating', `fluctuating scores detected as "fluctuating" (got: ${fluct.trend})`);

    // Stable trend
    const stable = await postAgent(
      { scores: { math: 75 }, weak_topics: ['geometry'], strong_topics: [], streak: 15, recent_scores: [0.7, 0.72, 0.71, 0.69, 0.7] },
      'dashboard'
    );
    assert(stable.trend === 'stable', `stable scores detected as "stable" (got: ${stable.trend})`);

    // Declining prevents advance
    assert(declining.action !== 'advance', `declining trend prevents "advance" (got: ${declining.action})`);

    // Fluctuating forces practice
    assert(fluct.action === 'practice', `fluctuating trend forces "practice" (got: ${fluct.action})`);
  }

  // ── 4. Confidence Detection ──
  console.log('\n💪 4. CONFIDENCE DETECTION');
  {
    // High confidence: low variance, decent scores
    const highConf = await postAgent(
      { scores: { physics: 80 }, weak_topics: [], strong_topics: ['mechanics'], streak: 20, recent_scores: [0.78, 0.82, 0.80, 0.79, 0.81] },
      'dashboard'
    );
    assert(highConf.confidence === 'high', `consistent high scores → high confidence (got: ${highConf.confidence})`);

    // Low confidence: high variance or very low scores
    const lowConf = await postAgent(
      { scores: { physics: 30 }, weak_topics: ['everything'], strong_topics: [], streak: 1, recent_scores: [0.1, 0.5, 0.15, 0.4, 0.2] },
      'dashboard'
    );
    assert(lowConf.confidence === 'low', `volatile low scores → low confidence (got: ${lowConf.confidence})`);
  }

  // ── 5. Action Deduplication ──
  console.log('\n🔄 5. ACTION DEDUPLICATION');
  {
    // When last_action is 'practice' and data suggests practice, it should switch
    const dedup = await postAgent(
      { scores: { physics: 60 }, weak_topics: ['waves'], strong_topics: [], streak: 5, recent_scores: [0.55, 0.6, 0.55], last_action: 'practice' },
      'dashboard'
    );
    // With rule fallback, this should switch away from practice
    // (LLM might still choose practice if it has strong reasoning, which is acceptable)
    assert(
      dedup.source === 'groq-ai' || dedup.action !== 'practice',
      `last_action=practice → varied action or AI override (got: action=${dedup.action}, source=${dedup.source})`
    );

    const dedup2 = await postAgent(
      { scores: { physics: 30 }, weak_topics: ['thermo'], strong_topics: [], streak: 2, recent_scores: [0.2, 0.3, 0.25], last_action: 'revise' },
      'dashboard'
    );
    assert(
      dedup2.source === 'groq-ai' || dedup2.action !== 'revise',
      `last_action=revise → varied action or AI override (got: action=${dedup2.action}, source=${dedup2.source})`
    );
  }

  // ── 6. All 5 Page Contexts ──
  console.log('\n🌐 6. ALL PAGE CONTEXTS');
  {
    const contexts = ['dashboard', 'learning', 'resources', 'revision', 'chat'];
    for (const ctx of contexts) {
      const d = await postAgent(
        { scores: { physics: 65 }, weak_topics: ['optics'], strong_topics: [], streak: 8, recent_scores: [0.6, 0.65, 0.6] },
        ctx
      );
      assert(d.insight && d.action && d.source, `context "${ctx}" returns valid decision`);
    }
  }

  // ── 7. User State Persistence ──
  console.log('\n💾 7. USER STATE PERSISTENCE');
  {
    const result = await postUserState({ subject: 'chemistry', topic: 'organic reactions', score: 0.45, mistakes: [{ topic: 'nomenclature' }] });
    assert(result.ok === true, 'user state sync returns ok=true');
    assert(result.state && result.state.scores, 'user state returns scores');
    assert(result.state.weak_topics !== undefined, 'user state returns weak_topics');
  }

  // ── 8. Frontend Script Injection ──
  console.log('\n🖥  8. FRONTEND SCRIPT INJECTION');
  {
    const pages = ['dashboard.html', 'learning.html', 'videos.html', 'revision.html', 'chat.html'];
    for (const page of pages) {
      const { status, body } = await fetchPage(page);
      assert(status === 200, `${page} returns 200`);
      assert(body.includes('agent-client.js'), `${page} includes agent-client.js`);
    }

    // Check agent-client.js itself is served
    const { status, body } = await fetchPage('agent-client.js');
    assert(status === 200, 'agent-client.js returns 200');
    assert(body.includes('AgentTutor'), 'agent-client.js contains AgentTutor IIFE');
    assert(body.includes('last_action'), 'agent-client.js tracks last_action');
  }

  // ── 9. Hardcoded Port Fix ──
  console.log('\n🔌 9. HARDCODED PORT FIX');
  {
    const { body } = await fetchPage('chat.html');
    const hardcoded = (body.match(/localhost:5050/g) || []).length;
    assert(hardcoded === 0, `chat.html has no hardcoded localhost:5050 (found: ${hardcoded})`);
  }

  // ── 10. Error Fallback ──
  console.log('\n🛡  10. ERROR FALLBACK');
  {
    // Send malformed state — should still return a valid decision
    const d = await postAgent({}, 'dashboard');
    assert(d.insight && d.action, 'malformed input still returns valid decision');

    const d2 = await postAgent(null, 'dashboard');
    assert(d2.insight && d2.action, 'null input still returns valid decision');
  }

  // ── Summary ──
  console.log('\n═══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test suite crashed:', err.message);
  process.exit(1);
});
