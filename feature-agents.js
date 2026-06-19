/* =====================================================
   AdaptEd Ai - Feature Agents
   Quiz, Test, Chatbot, Learning Path, Resource agents.
===================================================== */

(function (global) {
    'use strict';

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function asObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function asNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function unique(values) {
        const out = [];
        const seen = new Set();
        for (const item of asArray(values)) {
            const text = String(item || '').trim();
            if (!text) continue;
            const key = text.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(text);
        }
        return out;
    }

    async function getDataAgent() {
        if (!global.DataAgent) return null;
        if (typeof global.DataAgent.ready === 'function') {
            await global.DataAgent.ready();
        }
        return global.DataAgent;
    }

    function getCurrentExam() {
        try {
            if (global.ExamManager && typeof global.ExamManager.get === 'function') {
                return global.ExamManager.get();
            }
        } catch {
            // ignore
        }
        return 'JEE';
    }

    function inferWeakAreas(payload) {
        const explicit = unique(payload.weakAreas || []);
        if (explicit.length) return explicit;

        const byWrongIds = [];
        const wrongIds = asArray(payload.wrongQuestionIds || payload.wrongIds);
        const questionBank = asArray(payload.questions);

        if (wrongIds.length && questionBank.length) {
            const lookup = new Map(questionBank.map((q) => [q.id, q]));
            for (const id of wrongIds) {
                const q = lookup.get(id);
                if (q && q.topic) byWrongIds.push(q.topic);
            }
        }

        return unique(byWrongIds);
    }

    function getToken() {
        return localStorage.getItem('ls-token') || localStorage.getItem('token') || '';
    }

    function getApiBase() {
        if (typeof global.API === 'string' && global.API.trim()) return global.API;
        const origin = global.location && global.location.origin ? global.location.origin : '';
        if (origin && origin !== 'null') return origin;
        return 'http://localhost:5050';
    }

    async function authFetchJson(path, options = {}) {
        const token = getToken();
        if (!token) throw new Error('Auth token unavailable');

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        };

        const res = await fetch(`${getApiBase()}${path}`, {
            ...options,
            headers,
        });

        let body = {};
        try {
            body = await res.json();
        } catch {
            body = {};
        }

        if (!res.ok) {
            throw new Error(body.error || `Request failed (${res.status})`);
        }

        return body;
    }

    const QuizAgent = {
        async fetchQuestions(questionBank, topic, count, mixedTopics) {
            if (global.QuizEngine && typeof global.QuizEngine.selectQuestions === 'function') {
                return global.QuizEngine.selectQuestions(questionBank, topic, count, mixedTopics);
            }
            return asArray(questionBank).slice(0, count || 5);
        },

        evaluateAnswers(questions, answers) {
            const qList = asArray(questions);
            const answerMap = asObject(answers);
            let correct = 0;
            const wrongQuestionIds = [];

            qList.forEach((q, idx) => {
                const response = answerMap[idx];
                if (response === q.correct || response === q.correctIndex) {
                    correct += 1;
                } else {
                    wrongQuestionIds.push(q.id);
                }
            });

            const total = qList.length || 1;
            const score = Math.round((correct / total) * 100);
            return {
                total,
                correct,
                score,
                wrongQuestionIds,
                weakAreas: inferWeakAreas({ wrongQuestionIds, questions: qList })
            };
        },

        async recordQuizSession(payload) {
            const da = await getDataAgent();
            if (!da) return null;

            const total = Math.max(1, Math.floor(asNumber(payload.total, asArray(payload.questions).length || 1)));
            const correct = Math.max(0, Math.floor(asNumber(payload.correct, 0)));
            const score = payload.score !== undefined
                ? Math.round(asNumber(payload.score, 0))
                : Math.round((correct / total) * 100);

            const entry = {
                topic: payload.topic || 'General',
                score,
                correct,
                total,
                timeTaken: Math.max(0, Math.floor(asNumber(payload.timeTaken || payload.durationSec, 0))),
                wrongQuestionIds: asArray(payload.wrongQuestionIds || payload.wrongIds),
                weakAreas: inferWeakAreas(payload),
                exam: payload.exam || getCurrentExam(),
                ts: Date.now()
            };

            const loggedQuiz = await da.logQuizResult(entry);

            const profile = typeof da.getUserProfile === 'function'
                ? await da.getUserProfile()
                : {};

            const userId = String((profile && profile.id) || localStorage.getItem('user_id') || localStorage.getItem('user_email') || '').trim();

            const topicBreakdown = [];
            const byTopic = {};
            for (const q of asArray(payload.questions)) {
                const key = String(q.topic || payload.topic || 'General').trim();
                if (!key) continue;
                if (!byTopic[key]) byTopic[key] = { topic: key, correct: 0, attempts: 0 };
                byTopic[key].attempts += 1;
            }

            const wrongSet = new Set(asArray(payload.wrongQuestionIds || payload.wrongIds));
            for (const q of asArray(payload.questions)) {
                const key = String(q.topic || payload.topic || 'General').trim();
                if (!key || !byTopic[key]) continue;
                if (!wrongSet.has(q.id)) byTopic[key].correct += 1;
            }

            Object.values(byTopic).forEach((row) => {
                const attempts = Math.max(1, row.attempts);
                topicBreakdown.push({
                    userId,
                    topic: row.topic,
                    correct: row.correct,
                    attempts,
                    accuracy: row.correct / attempts,
                    timeTaken: Math.max(0, asNumber(payload.timeTaken || payload.durationSec, 0)) * (attempts / Math.max(1, total))
                });
            });

            if (typeof da.logStudentPerformance === 'function') {
                for (const perfRow of topicBreakdown) {
                    await da.logStudentPerformance(perfRow);
                }
            }

            if (!payload.skipBackendSync) {
                try {
                    await authFetchJson('/api/performance/quiz', {
                        method: 'POST',
                        body: JSON.stringify({
                            userId,
                            topicBreakdown,
                            topic: entry.topic,
                            correct: entry.correct,
                            attempts: entry.total,
                            score: entry.score,
                            timeTaken: entry.timeTaken,
                            exam: entry.exam
                        })
                    });
                } catch (err) {
                    console.warn('[QuizAgent] Backend performance sync failed:', err.message || err);
                }
            }

            return loggedQuiz;
        },

        async getAssignedQuizzes() {
            return authFetchJson('/api/quiz/assigned', { method: 'GET' });
        },

        async getAssignedQuiz(quizType, quizId) {
            const safeType = encodeURIComponent(String(quizType || 'AdminQuiz'));
            const safeId = encodeURIComponent(String(quizId || ''));
            return authFetchJson(`/api/quiz/assigned/${safeType}/${safeId}`, { method: 'GET' });
        },

        async submitAssignedQuiz(quizType, quizId, payload) {
            const safeType = encodeURIComponent(String(quizType || 'AdminQuiz'));
            const safeId = encodeURIComponent(String(quizId || ''));
            return authFetchJson(`/api/quiz/assigned/${safeType}/${safeId}/submit`, {
                method: 'POST',
                body: JSON.stringify(payload || {})
            });
        }
    };

    const TestAgent = {
        async recordTestSession(payload) {
            const da = await getDataAgent();
            if (!da) return null;

            const weakAreas = unique(payload.weakAreas || []);
            const topics = unique(payload.topics || weakAreas);
            const score = Math.round(asNumber(payload.score ?? payload.pct, 0));

            const entry = {
                testId: payload.testId || payload.exam || `test-${Date.now()}`,
                exam: payload.exam || getCurrentExam(),
                score,
                topics,
                weakAreas,
                marks: asNumber(payload.marks, 0),
                maxMarks: asNumber(payload.maxMarks, 0),
                ts: Date.now()
            };

            return da.logTestResult(entry);
        }
    };

    function historyForChatPayload(entries, limit = 10) {
        const out = [];
        for (const row of asArray(entries)) {
            if (row.message) out.push({ role: 'user', text: row.message });
            if (row.response) out.push({ role: 'assistant', text: row.response });
        }
        return out.slice(-limit);
    }

    const ChatbotAgent = {
        async getRecentHistory(limit = 20) {
            const da = await getDataAgent();
            if (!da) return [];
            const rows = await da.getChatHistory(limit);
            return historyForChatPayload(rows, limit);
        },

        async buildPayload(message, basePayload) {
            const da = await getDataAgent();
            if (!da) {
                return {
                    ...(asObject(basePayload)),
                    message
                };
            }

            const payloadBase = asObject(basePayload);
            const userState = await da.getUserState();
            const weakTopics = await da.getWeakTopics();
            const quizPerf = await da.getQuizPerformance(15);
            const storedHistory = await da.getChatHistory(12);

            const recentMistakes = quizPerf
                .filter((x) => asNumber(x.score, 0) < 60)
                .slice(-6)
                .map((x) => ({ topic: x.topic, score: x.score, ts: x.ts }));

            const fallbackHistory = historyForChatPayload(storedHistory, 10);
            const history = asArray(payloadBase.history).length ? payloadBase.history : fallbackHistory;

            return {
                ...payloadBase,
                message,
                history,
                userState,
                weakTopics,
                recentMistakes
            };
        },

        async recordUserMessage(message, context) {
            const da = await getDataAgent();
            if (!da) return null;

            return da.logChatMessage({
                message,
                response: '',
                context: {
                    ...(asObject(context)),
                    stage: 'user'
                },
                ts: Date.now()
            });
        },

        async recordExchange(message, response, context) {
            const da = await getDataAgent();
            if (!da) return null;

            return da.logChatMessage({
                message,
                response,
                context: asObject(context),
                ts: Date.now()
            });
        }
    };

    const LearningPathAgent = {
        async getPlan() {
            const da = await getDataAgent();
            if (!da) return null;
            return da.getLearningPlan();
        },

        async savePlan(plan) {
            const da = await getDataAgent();
            if (!da) return null;
            return da.saveLearningPlan(plan);
        },

        async adaptPlanFromPerformance() {
            const da = await getDataAgent();
            if (!da) return null;

            const plan = await da.getLearningPlan();
            const weakTopics = await da.getWeakTopics();
            if (!plan || !Array.isArray(plan.nodes) || !plan.nodes.length) {
                return plan;
            }

            let changed = false;
            const nodes = plan.nodes.slice();
            const lowerWeak = new Set(weakTopics.map((t) => String(t).toLowerCase()));

            const existingTopics = new Set(nodes.map((n) => String(n.topic || '').toLowerCase()));
            for (const weak of weakTopics) {
                const weakKey = String(weak || '').toLowerCase();
                if (!weakKey || existingTopics.has(weakKey)) continue;

                nodes.push({
                    id: `reinforce-${weakKey}-${Date.now()}`,
                    topic: weak,
                    displayName: weak,
                    subject: 'general',
                    resourceLinks: [],
                    status: 'locked',
                    type: 'reinforcement'
                });
                existingTopics.add(weakKey);
                changed = true;
            }

            let activeIdx = nodes.findIndex((n) => n.status === 'active');
            if (activeIdx === -1) {
                const nextIdx = nodes.findIndex((n) => n.status !== 'completed');
                const target = nextIdx >= 0 ? nextIdx : 0;
                nodes[target] = { ...nodes[target], status: 'active' };
                activeIdx = target;
                changed = true;
            }

            const activeNode = nodes[activeIdx];
            if (activeNode && lowerWeak.has(String(activeNode.topic || '').toLowerCase()) && activeNode.status !== 'active') {
                nodes[activeIdx] = { ...activeNode, status: 'active' };
                changed = true;
            }

            const nextPlan = {
                ...plan,
                nodes,
                currentNodeId: nodes[activeIdx] ? nodes[activeIdx].id : plan.currentNodeId
            };

            if (changed) {
                await da.saveLearningPlan(nextPlan);
            }

            return nextPlan;
        },

        async resetPlan() {
            const da = await getDataAgent();
            if (!da) return false;
            await da.resetLearningData();
            return true;
        }
    };

    const ResourceAgent = {
        async getSuggestions(limit = 6) {
            const da = await getDataAgent();
            if (!da) return [];

            const weakTopics = await da.getWeakTopics();
            const plan = await da.getLearningPlan();
            const nodes = Array.isArray(plan?.nodes) ? plan.nodes : [];
            const suggestions = [];

            for (const topic of weakTopics) {
                const node = nodes.find(
                    (n) => String(n.topic || '').toLowerCase() === String(topic || '').toLowerCase()
                );

                if (node && Array.isArray(node.resourceLinks) && node.resourceLinks.length) {
                    for (const link of node.resourceLinks) {
                        suggestions.push({
                            topic,
                            type: 'resource',
                            title: `Practice ${topic}`,
                            url: link
                        });
                    }
                } else {
                    suggestions.push({
                        topic,
                        type: 'search',
                        title: `Find tutorials for ${topic}`,
                        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' exam concepts')}`
                    });
                }
            }

            return suggestions.slice(0, Math.max(1, Math.floor(asNumber(limit, 6))));
        }
    };

    global.QuizAgent = QuizAgent;
    global.TestAgent = TestAgent;
    global.ChatbotAgent = ChatbotAgent;
    global.LearningPathAgent = LearningPathAgent;
    global.ResourceAgent = ResourceAgent;

    global.AgentHub = {
        QuizAgent,
        TestAgent,
        ChatbotAgent,
        LearningPathAgent,
        ResourceAgent
    };
})(window);
