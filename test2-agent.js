const BASE = process.env.BASE_URL || 'http://localhost:5050';
let p = 0, f = 0;

function ok(c, l) {
  if (c) {
    p++;
    console.log('PASS: ' + l);
  } else {
    f++;
    console.log('FAIL: ' + l);
  }
}

async function post(s, c) {
  const r = await fetch(BASE + '/api/agent/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_state: s, context: c })
  });
  return r.json();
}

async function run() {
  let d;
  d = await post({ scores: { physics: 50 }, weak_topics: ['optics'], strong_topics: [], streak: 5, recent_scores: [0.5, 0.5, 0.5] }, 'dashboard');
  ok(d.insight && d.action && d.trend && d.confidence, 'T1: response shape');

  d = await post({ scores: { physics: 30 }, weak_topics: ['thermo'], strong_topics: [], streak: 2, recent_scores: [0.2, 0.3, 0.25] }, 'dashboard');
  ok(d.action === 'revise', 'T2: weak=revise got:' + d.action);

  d = await post({ scores: { physics: 60 }, weak_topics: ['waves'], strong_topics: [], streak: 7, recent_scores: [0.55, 0.6, 0.65] }, 'dashboard');
  ok(d.action === 'practice', 'T3: mid=practice got:' + d.action);

  d = await post({ scores: { math: 70 }, weak_topics: ['calc'], strong_topics: [], streak: 10, recent_scores: [0.4, 0.5, 0.6, 0.7, 0.75] }, 'dashboard');
  ok(d.trend === 'improving', 'T4: trend=improving got:' + d.trend);

  d = await post({ scores: { physics: 60 }, weak_topics: ['optics'], strong_topics: [], streak: 5, recent_scores: [0.8, 0.7, 0.6, 0.5, 0.4] }, 'dashboard');
  ok(d.trend === 'declining', 'T5: trend=declining got:' + d.trend);

  d = await post({ scores: { chem: 55 }, weak_topics: ['bonds'], strong_topics: [], streak: 8, recent_scores: [0.4, 0.8, 0.3, 0.7, 0.4, 0.8] }, 'dashboard');
  ok(d.trend === 'fluctuating', 'T6: trend=fluct got:' + d.trend);
  ok(d.action === 'practice', 'T7: fluct=practice got:' + d.action);

  d = await post({ scores: { math: 75 }, weak_topics: ['geo'], strong_topics: [], streak: 15, recent_scores: [0.7, 0.72, 0.71, 0.69, 0.7] }, 'dashboard');
  ok(d.trend === 'stable', 'T8: trend=stable got:' + d.trend);

  d = await post({ scores: { physics: 80 }, weak_topics: [], strong_topics: ['mech'], streak: 20, recent_scores: [0.78, 0.82, 0.80, 0.79, 0.81] }, 'dashboard');
  ok(d.confidence === 'high', 'T9: conf=high got:' + d.confidence);

  d = await post({ scores: { physics: 30 }, weak_topics: ['all'], strong_topics: [], streak: 1, recent_scores: [0.1, 0.5, 0.15, 0.4, 0.2] }, 'dashboard');
  ok(d.confidence === 'low', 'T10: conf=low got:' + d.confidence);

  d = await post({ scores: { physics: 60 }, weak_topics: ['waves'], strong_topics: [], streak: 5, recent_scores: [0.55, 0.6, 0.55], last_action: 'practice' }, 'dashboard');
  ok(d.source === 'groq-ai' || d.action !== 'practice', 'T11: dedup practice, action=' + d.action);

  d = await post({ scores: { physics: 30 }, weak_topics: ['th'], strong_topics: [], streak: 2, recent_scores: [0.2, 0.3, 0.25], last_action: 'revise' }, 'dashboard');
  ok(d.source === 'groq-ai' || d.action !== 'revise', 'T12: dedup revise, action=' + d.action);

  const r = await fetch(BASE + '/chat.html');
  ok(!(await r.text()).includes('localhost:5050'), 'T13: no hardcoded 5050');

  const r2 = await fetch(BASE + '/dashboard.html');
  ok((await r2.text()).includes('agent-client.js'), 'T14: dash has agent-client');

  d = await post({}, 'dashboard');
  ok(d.insight && d.action, 'T15: empty state fallback');

  console.log('\\nRESULT: ' + p + ' passed, ' + f + ' failed');
  if (f > 0) process.exit(1);
}

run().catch(e => {
  console.log('CRASH: ' + e.message);
  process.exit(1);
});
