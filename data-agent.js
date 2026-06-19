/* =====================================================
   AdaptEd Ai - Central Data Agent
   Single source of truth for shared feature state.
===================================================== */

(function (global) {
    'use strict';

    const DB_NAME = 'adapted_ai_data_agent';
    const DB_VERSION = 1;
    const STORE_NAME = 'records';
    const STORE_KEY = 'state';
    const FALLBACK_KEY = 'adapted_data_agent_store';
    const READY_EVENT = 'adapted:data-agent-ready';
    const UPDATE_EVENT = 'adapted:data-agent-updated';

    const MAX_QUIZ_LOG = 500;
    const MAX_TEST_LOG = 300;
    const MAX_CHAT_LOG = 300;
    const MAX_STUDENT_PERF_LOG = 2000;

    const DEFAULT_USER_STATE = {
        masteryLevel: 0,
        weakTopics: [],
        strongTopics: [],
        failureCount: {}
    };

    const DEFAULT_LEARNING_PLAN = {
        nodes: [],
        currentNodeId: null
    };

    const DEFAULT_STATE = {
        userProfile: null,
        learningPlan: DEFAULT_LEARNING_PLAN,
        userState: DEFAULT_USER_STATE,
        quizPerformance: [],
        studentPerformance: [],
        testPerformance: [],
        chatHistory: [],
        compat: {
            quizEnginePerf: {},
            learningQuizProgress: {},
            vectorIndex: null,
            selectedExam: 'JEE',
            studyActivity: {},
            quizScoreHistory: []
        }
    };

    let state = clone(DEFAULT_STATE);
    let db = null;
    let initialized = false;
    let initPromise = null;
    let persistQueue = Promise.resolve();

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function safeParse(jsonText, fallback) {
        try {
            const parsed = JSON.parse(jsonText);
            return parsed === null || parsed === undefined ? fallback : parsed;
        } catch {
            return fallback;
        }
    }

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

    function normalizeTopic(topic) {
        return String(topic || '').trim();
    }

    function uniqueStringArray(values) {
        const out = [];
        const seen = new Set();
        for (const raw of asArray(values)) {
            const v = String(raw || '').trim();
            if (!v) continue;
            if (seen.has(v.toLowerCase())) continue;
            seen.add(v.toLowerCase());
            out.push(v);
        }
        return out;
    }

    function normalizeFailureCount(value) {
        const out = {};
        for (const [k, v] of Object.entries(asObject(value))) {
            const topic = normalizeTopic(k);
            if (!topic) continue;
            out[topic] = Math.max(0, Math.floor(asNumber(v, 0)));
        }
        return out;
    }

    function normalizeUserState(value) {
        const merged = {
            ...clone(DEFAULT_USER_STATE),
            ...asObject(value)
        };
        merged.weakTopics = uniqueStringArray(merged.weakTopics);
        merged.strongTopics = uniqueStringArray(merged.strongTopics).filter(
            (topic) => !merged.weakTopics.some((weak) => weak.toLowerCase() === topic.toLowerCase())
        );
        merged.failureCount = normalizeFailureCount(merged.failureCount);
        merged.masteryLevel = Math.max(0, Math.min(100, Math.round(asNumber(merged.masteryLevel, 0))));
        return merged;
    }

    function normalizeLearningPlan(value) {
        const merged = {
            ...clone(DEFAULT_LEARNING_PLAN),
            ...asObject(value)
        };
        merged.nodes = asArray(merged.nodes);
        merged.currentNodeId = merged.currentNodeId || (merged.nodes[0] ? merged.nodes[0].id : null);
        return merged;
    }

    function normalizeQuizEntry(value) {
        const source = asObject(value);
        const ts = asNumber(source.ts, Date.now());
        const total = Math.max(1, asNumber(source.total, source.correct ? source.correct : 1));
        const scoreRaw = source.score !== undefined ? source.score : source.pct;
        const score = Math.max(0, Math.min(100, Math.round(asNumber(scoreRaw, 0))));

        return {
            topic: normalizeTopic(source.topic || source.subject || 'General'),
            score,
            correct: Math.max(0, Math.floor(asNumber(source.correct, 0))),
            timeTaken: Math.max(0, Math.floor(asNumber(source.timeTaken || source.durationSec, 0))),
            total,
            wrongIds: asArray(source.wrongIds || source.wrongQuestionIds),
            weakAreas: uniqueStringArray(source.weakAreas || []),
            exam: String(source.exam || 'JEE'),
            ts
        };
    }

    function normalizeTestEntry(value) {
        const source = asObject(value);
        return {
            testId: String(source.testId || source.exam || `test-${Date.now()}`),
            score: Math.max(0, Math.min(100, Math.round(asNumber(source.score ?? source.pct, 0)))),
            topics: uniqueStringArray(source.topics || []),
            weakAreas: uniqueStringArray(source.weakAreas || []),
            marks: asNumber(source.marks, 0),
            maxMarks: asNumber(source.maxMarks, 0),
            exam: String(source.exam || source.testId || 'JEE'),
            ts: asNumber(source.ts, Date.now())
        };
    }

    function normalizeChatEntry(value) {
        const source = asObject(value);
        return {
            message: String(source.message || ''),
            response: String(source.response || ''),
            context: asObject(source.context),
            ts: asNumber(source.ts, Date.now())
        };
    }

    function normalizeStudentPerformanceEntry(value) {
        const source = asObject(value);
        const userId = String(source.userId || source.email || '').trim();
        const topic = normalizeTopic(source.topic || source.subject || 'General');
        const attempts = Math.max(1, Math.floor(asNumber(source.attempts, 1)));
        const correct = Math.max(0, Math.min(attempts, Math.floor(asNumber(source.correct, 0))));
        const accuracy = source.accuracy !== undefined
            ? Math.max(0, Math.min(1, asNumber(source.accuracy, 0)))
            : (attempts ? correct / attempts : 0);

        return {
            userId,
            topic: topic || 'General',
            correct,
            attempts,
            accuracy: Number(accuracy.toFixed(4)),
            timeTaken: Math.max(0, asNumber(source.timeTaken, 0)),
            ts: asNumber(source.ts, Date.now())
        };
    }

    function legacyQuizToCanonical(value) {
        const source = asObject(value);
        return normalizeQuizEntry({
            topic: source.topic || 'General',
            score: source.pct,
            correct: source.correct,
            timeTaken: source.timeTaken,
            ts: source.ts
        });
    }

    function legacyTestToCanonical(value) {
        const source = asObject(value);
        return normalizeTestEntry({
            testId: source.exam || source.testId,
            exam: source.exam,
            score: source.pct,
            marks: source.marks,
            maxMarks: source.maxMarks,
            weakAreas: source.weakAreas,
            topics: source.topics,
            ts: source.ts
        });
    }

    function canonicalQuizToLegacy(value) {
        const entry = normalizeQuizEntry(value);
        const dateObj = new Date(entry.ts);
        const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return {
            date,
            pct: entry.score,
            topic: entry.topic,
            ts: entry.ts
        };
    }

    function canonicalTestToLegacy(value) {
        const entry = normalizeTestEntry(value);
        return {
            exam: entry.exam,
            pct: entry.score,
            marks: entry.marks,
            maxMarks: entry.maxMarks,
            ts: entry.ts,
            weakAreas: entry.weakAreas,
            topics: entry.topics
        };
    }

    function normalizeCompat(value) {
        const merged = {
            ...clone(DEFAULT_STATE.compat),
            ...asObject(value)
        };
        merged.quizEnginePerf = asObject(merged.quizEnginePerf);
        merged.learningQuizProgress = asObject(merged.learningQuizProgress);
        merged.vectorIndex = merged.vectorIndex === null ? null : merged.vectorIndex;
        merged.selectedExam = String(merged.selectedExam || 'JEE');
        merged.studyActivity = asObject(merged.studyActivity);
        merged.quizScoreHistory = asArray(merged.quizScoreHistory);
        return merged;
    }

    function normalizeState(value) {
        const merged = {
            ...clone(DEFAULT_STATE),
            ...asObject(value)
        };

        merged.userProfile = merged.userProfile ? asObject(merged.userProfile) : null;
        merged.learningPlan = normalizeLearningPlan(merged.learningPlan);
        merged.userState = normalizeUserState(merged.userState);
        merged.quizPerformance = asArray(merged.quizPerformance).map(normalizeQuizEntry);
        merged.studentPerformance = asArray(merged.studentPerformance).map(normalizeStudentPerformanceEntry);
        merged.testPerformance = asArray(merged.testPerformance).map(normalizeTestEntry);
        merged.chatHistory = asArray(merged.chatHistory).map(normalizeChatEntry);
        merged.compat = normalizeCompat(merged.compat);

        return merged;
    }

    function readFallbackState() {
        const raw = global.localStorage ? localStorage.getItem(FALLBACK_KEY) : null;
        if (!raw) return null;
        return safeParse(raw, null);
    }

    function writeFallbackState(snapshot) {
        if (!global.localStorage) return;
        localStorage.setItem(FALLBACK_KEY, JSON.stringify(snapshot));
    }

    function dispatch(name, detail) {
        try {
            global.dispatchEvent(new CustomEvent(name, { detail }));
        } catch {
            // ignore dispatch failures
        }
    }

    function openDb() {
        return new Promise((resolve, reject) => {
            if (!global.indexedDB) {
                reject(new Error('IndexedDB not available'));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const dbRef = event.target.result;
                if (!dbRef.objectStoreNames.contains(STORE_NAME)) {
                    dbRef.createObjectStore(STORE_NAME, { keyPath: 'key' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
        });
    }

    function readDbState() {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve(null);
                return;
            }

            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(STORE_KEY);

            req.onsuccess = () => {
                resolve(req.result ? req.result.value : null);
            };
            req.onerror = () => reject(req.error || new Error('Failed to read IndexedDB state'));
        });
    }

    function writeDbState(snapshot) {
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve();
                return;
            }

            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put({ key: STORE_KEY, value: snapshot });

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('Failed to write IndexedDB state'));
        });
    }

    function ingestLegacyData() {
        if (!global.localStorage) return;

        const legacyProfile = safeParse(localStorage.getItem('userProfile'), null);
        if (!state.userProfile && legacyProfile) {
            state.userProfile = asObject(legacyProfile);
        }

        const legacyPlan = safeParse(localStorage.getItem('learningPlan'), null);
        if ((!state.learningPlan || !asArray(state.learningPlan.nodes).length) && legacyPlan) {
            state.learningPlan = normalizeLearningPlan(legacyPlan);
        }

        const legacyUserState = safeParse(localStorage.getItem('userState'), null);
        if (legacyUserState) {
            state.userState = normalizeUserState({ ...state.userState, ...legacyUserState });
        }

        const legacyQuizScores = safeParse(localStorage.getItem('ls-quiz-scores'), []);
        state.compat.quizScoreHistory = Array.isArray(legacyQuizScores) ? legacyQuizScores : [];
        if (!state.quizPerformance.length && Array.isArray(legacyQuizScores) && legacyQuizScores.length) {
            state.quizPerformance = legacyQuizScores.map(legacyQuizToCanonical);
        }

        const legacyExamHistory = safeParse(localStorage.getItem('ls-exam-history'), []);
        if (!state.testPerformance.length && Array.isArray(legacyExamHistory) && legacyExamHistory.length) {
            state.testPerformance = legacyExamHistory.map(legacyTestToCanonical);
        }

        const legacyChat = safeParse(localStorage.getItem('ls-chat-history'), []);
        if (!state.chatHistory.length && Array.isArray(legacyChat) && legacyChat.length) {
            state.chatHistory = legacyChat.map(normalizeChatEntry);
        }

        state.compat.quizEnginePerf = asObject(
            safeParse(localStorage.getItem('ls-quiz-perf'), state.compat.quizEnginePerf)
        );
        state.compat.learningQuizProgress = asObject(
            safeParse(localStorage.getItem('learningQuizProgress'), state.compat.learningQuizProgress)
        );

        const vectorIndex = safeParse(localStorage.getItem('vectorIndex'), state.compat.vectorIndex);
        state.compat.vectorIndex = vectorIndex === undefined ? null : vectorIndex;

        const selectedExam = localStorage.getItem('ls-exam');
        if (selectedExam) state.compat.selectedExam = selectedExam;

        state.compat.studyActivity = asObject(
            safeParse(localStorage.getItem('ls-study-activity'), state.compat.studyActivity)
        );
    }

    function mirrorLegacyKeys() {
        if (!global.localStorage) return;

        localStorage.setItem('userProfile', JSON.stringify(state.userProfile || {}));
        localStorage.setItem('learningPlan', JSON.stringify(state.learningPlan || DEFAULT_LEARNING_PLAN));
        localStorage.setItem('userState', JSON.stringify(state.userState || DEFAULT_USER_STATE));
        const scoreHistory = state.compat.quizScoreHistory.length
            ? state.compat.quizScoreHistory
            : state.quizPerformance.map(canonicalQuizToLegacy);
        localStorage.setItem('ls-quiz-scores', JSON.stringify(scoreHistory));
        localStorage.setItem('ls-exam-history', JSON.stringify(state.testPerformance.map(canonicalTestToLegacy)));
        localStorage.setItem('ls-chat-history', JSON.stringify(state.chatHistory));
        localStorage.setItem('ls-quiz-perf', JSON.stringify(state.compat.quizEnginePerf || {}));
        localStorage.setItem('learningQuizProgress', JSON.stringify(state.compat.learningQuizProgress || {}));
        localStorage.setItem('ls-exam', String(state.compat.selectedExam || 'JEE'));
        localStorage.setItem('ls-study-activity', JSON.stringify(state.compat.studyActivity || {}));

        if (state.compat.vectorIndex) {
            localStorage.setItem('vectorIndex', JSON.stringify(state.compat.vectorIndex));
        }
    }

    function queuePersist() {
        const snapshot = clone(state);
        persistQueue = persistQueue
            .then(async () => {
                try {
                    if (db) {
                        await writeDbState(snapshot);
                    } else {
                        writeFallbackState(snapshot);
                    }
                } catch {
                    writeFallbackState(snapshot);
                }

                mirrorLegacyKeys();
                dispatch(UPDATE_EVENT, clone(state));
            })
            .catch(() => {
                // keep queue alive
            });

        return persistQueue;
    }

    function bootstrapSync() {
        if (initialized) return;
        const fallback = readFallbackState();
        if (fallback) {
            state = normalizeState(fallback);
        }
        ingestLegacyData();
        state = normalizeState(state);
    }

    async function init() {
        if (initialized) return clone(state);
        if (initPromise) return initPromise;

        initPromise = (async () => {
            let hydrated = null;

            try {
                db = await openDb();
                hydrated = await readDbState();
            } catch {
                db = null;
            }

            if (!hydrated) {
                hydrated = readFallbackState();
            }

            state = normalizeState(hydrated || {});
            ingestLegacyData();
            state = normalizeState(state);

            initialized = true;
            await queuePersist();
            dispatch(READY_EVENT, clone(state));
            return clone(state);
        })();

        return initPromise;
    }

    async function ensureReady() {
        return init();
    }

    function applyQuizToUserState(entry) {
        const topic = normalizeTopic(entry.topic || 'General');
        const score = asNumber(entry.score, 0);
        const nextState = normalizeUserState(state.userState);

        if (topic) {
            if (score < 60) {
                if (!nextState.weakTopics.some((t) => t.toLowerCase() === topic.toLowerCase())) {
                    nextState.weakTopics.push(topic);
                }
                nextState.strongTopics = nextState.strongTopics.filter((t) => t.toLowerCase() !== topic.toLowerCase());
                nextState.failureCount[topic] = (nextState.failureCount[topic] || 0) + 1;
            } else if (score >= 80) {
                if (!nextState.strongTopics.some((t) => t.toLowerCase() === topic.toLowerCase())) {
                    nextState.strongTopics.push(topic);
                }
                nextState.weakTopics = nextState.weakTopics.filter((t) => t.toLowerCase() !== topic.toLowerCase());
                if (nextState.failureCount[topic]) {
                    nextState.failureCount[topic] = Math.max(0, nextState.failureCount[topic] - 1);
                }
            }
        }

        const recent = state.quizPerformance.slice(-20);
        if (recent.length) {
            const avg = recent.reduce((sum, item) => sum + asNumber(item.score, 0), 0) / recent.length;
            nextState.masteryLevel = Math.max(0, Math.min(100, Math.round(avg)));
        }

        state.userState = normalizeUserState(nextState);
    }

    function applyTestToUserState(entry) {
        const nextState = normalizeUserState(state.userState);
        nextState.masteryLevel = Math.max(0, Math.min(100, Math.round((nextState.masteryLevel * 0.7) + (entry.score * 0.3))));

        for (const weak of entry.weakAreas) {
            if (!nextState.weakTopics.some((t) => t.toLowerCase() === weak.toLowerCase())) {
                nextState.weakTopics.push(weak);
            }
            nextState.failureCount[weak] = (nextState.failureCount[weak] || 0) + 1;
            nextState.strongTopics = nextState.strongTopics.filter((t) => t.toLowerCase() !== weak.toLowerCase());
        }

        state.userState = normalizeUserState(nextState);
    }

    function mapCompatRead(key, fallback) {
        bootstrapSync();

        switch (key) {
            case 'userProfile':
                return clone(state.userProfile || fallback || {});
            case 'learningPlan':
                return clone(state.learningPlan || fallback || DEFAULT_LEARNING_PLAN);
            case 'userState':
                return clone(state.userState || fallback || DEFAULT_USER_STATE);
            case 'quizPerformance':
                return clone(state.quizPerformance || fallback || []);
            case 'studentPerformance':
                return clone(state.studentPerformance || fallback || []);
            case 'testPerformance':
                return clone(state.testPerformance || fallback || []);
            case 'chatHistory':
                return clone(state.chatHistory || fallback || []);
            case 'ls-quiz-scores':
                return clone(state.compat.quizScoreHistory.length
                    ? state.compat.quizScoreHistory
                    : state.quizPerformance.map(canonicalQuizToLegacy));
            case 'ls-exam-history':
                return clone(state.testPerformance.map(canonicalTestToLegacy));
            case 'ls-quiz-perf':
                return clone(state.compat.quizEnginePerf || fallback || {});
            case 'learningQuizProgress':
                return clone(state.compat.learningQuizProgress || fallback || {});
            case 'vectorIndex':
                return state.compat.vectorIndex === null ? (fallback || null) : clone(state.compat.vectorIndex);
            case 'ls-exam':
                return String(state.compat.selectedExam || fallback || 'JEE');
            case 'ls-study-activity':
                return clone(state.compat.studyActivity || fallback || {});
            default:
                if (!global.localStorage) return fallback;
                if (typeof fallback === 'string') return localStorage.getItem(key) || fallback;
                return safeParse(localStorage.getItem(key), fallback);
        }
    }

    function mapCompatWrite(key, value) {
        bootstrapSync();

        switch (key) {
            case 'userProfile':
                state.userProfile = value ? asObject(value) : null;
                break;
            case 'learningPlan':
                state.learningPlan = normalizeLearningPlan(value);
                break;
            case 'userState':
                state.userState = normalizeUserState(value);
                break;
            case 'quizPerformance':
                state.quizPerformance = asArray(value).map(normalizeQuizEntry).slice(-MAX_QUIZ_LOG);
                break;
            case 'studentPerformance':
                state.studentPerformance = asArray(value).map(normalizeStudentPerformanceEntry).slice(-MAX_STUDENT_PERF_LOG);
                break;
            case 'testPerformance':
                state.testPerformance = asArray(value).map(normalizeTestEntry).slice(-MAX_TEST_LOG);
                break;
            case 'chatHistory':
                state.chatHistory = asArray(value).map(normalizeChatEntry).slice(-MAX_CHAT_LOG);
                break;
            case 'ls-quiz-scores':
                state.compat.quizScoreHistory = asArray(value);
                break;
            case 'ls-exam-history':
                state.testPerformance = asArray(value).map(legacyTestToCanonical).slice(-MAX_TEST_LOG);
                break;
            case 'ls-quiz-perf':
                state.compat.quizEnginePerf = asObject(value);
                break;
            case 'learningQuizProgress':
                state.compat.learningQuizProgress = asObject(value);
                break;
            case 'vectorIndex':
                state.compat.vectorIndex = value === null ? null : value;
                break;
            case 'ls-exam':
                state.compat.selectedExam = String(value || 'JEE');
                break;
            case 'ls-study-activity':
                state.compat.studyActivity = asObject(value);
                break;
            default:
                if (global.localStorage) {
                    if (typeof value === 'string') {
                        localStorage.setItem(key, value);
                    } else {
                        localStorage.setItem(key, JSON.stringify(value));
                    }
                }
                return;
        }

        state = normalizeState(state);
        queuePersist();
    }

    const DataAgent = {
        init,
        ready: ensureReady,

        async saveUserProfile(userProfile) {
            await ensureReady();
            state.userProfile = userProfile ? asObject(userProfile) : null;
            queuePersist();
            return clone(state.userProfile || {});
        },

        async getUserProfile() {
            await ensureReady();
            return clone(state.userProfile || {});
        },

        async saveLearningPlan(learningPlan) {
            await ensureReady();
            state.learningPlan = normalizeLearningPlan(learningPlan);
            queuePersist();
            return clone(state.learningPlan);
        },

        async getLearningPlan() {
            await ensureReady();
            return clone(state.learningPlan);
        },

        async saveUserState(userState) {
            await ensureReady();
            state.userState = normalizeUserState(userState);
            queuePersist();
            return clone(state.userState);
        },

        async getUserState() {
            await ensureReady();
            return clone(state.userState);
        },

        getUserStateSync() {
            return mapCompatRead('userState', clone(DEFAULT_USER_STATE));
        },

        async logQuizResult(result) {
            await ensureReady();
            const entry = normalizeQuizEntry(result);
            state.quizPerformance.push(entry);
            if (state.quizPerformance.length > MAX_QUIZ_LOG) {
                state.quizPerformance = state.quizPerformance.slice(-MAX_QUIZ_LOG);
            }
            applyQuizToUserState(entry);
            queuePersist();
            return clone(entry);
        },

        async logStudentPerformance(entry) {
            await ensureReady();
            const normalized = normalizeStudentPerformanceEntry(entry);
            state.studentPerformance.push(normalized);
            if (state.studentPerformance.length > MAX_STUDENT_PERF_LOG) {
                state.studentPerformance = state.studentPerformance.slice(-MAX_STUDENT_PERF_LOG);
            }
            queuePersist();
            return clone(normalized);
        },

        async logTestResult(result) {
            await ensureReady();
            const entry = normalizeTestEntry(result);
            state.testPerformance.push(entry);
            if (state.testPerformance.length > MAX_TEST_LOG) {
                state.testPerformance = state.testPerformance.slice(-MAX_TEST_LOG);
            }
            applyTestToUserState(entry);
            queuePersist();
            return clone(entry);
        },

        async logChatMessage(entry) {
            await ensureReady();
            const next = normalizeChatEntry(entry);
            state.chatHistory.push(next);
            if (state.chatHistory.length > MAX_CHAT_LOG) {
                state.chatHistory = state.chatHistory.slice(-MAX_CHAT_LOG);
            }
            queuePersist();
            return clone(next);
        },

        async getChatHistory(limit = 30) {
            await ensureReady();
            const safeLimit = Math.max(1, Math.floor(asNumber(limit, 30)));
            return clone(state.chatHistory.slice(-safeLimit));
        },

        async getQuizPerformance(limit = 50) {
            await ensureReady();
            const safeLimit = Math.max(1, Math.floor(asNumber(limit, 50)));
            return clone(state.quizPerformance.slice(-safeLimit));
        },

        async getStudentPerformance(limit = 100) {
            await ensureReady();
            const safeLimit = Math.max(1, Math.floor(asNumber(limit, 100)));
            return clone(state.studentPerformance.slice(-safeLimit));
        },

        async getTestPerformance(limit = 20) {
            await ensureReady();
            const safeLimit = Math.max(1, Math.floor(asNumber(limit, 20)));
            return clone(state.testPerformance.slice(-safeLimit));
        },

        async getWeakTopics() {
            await ensureReady();
            return clone(state.userState.weakTopics || []);
        },

        async getSnapshot() {
            await ensureReady();
            return clone(state);
        },

        async resetLearningData() {
            await ensureReady();
            state.learningPlan = normalizeLearningPlan(DEFAULT_LEARNING_PLAN);
            state.userState = normalizeUserState(DEFAULT_USER_STATE);
            state.quizPerformance = [];
            state.studentPerformance = [];
            state.testPerformance = [];
            state.compat.learningQuizProgress = {};
            state.compat.quizEnginePerf = {};
            state.compat.vectorIndex = null;

            if (global.localStorage) {
                localStorage.removeItem('ls-quiz-bank');
            }

            queuePersist();
            return true;
        },

        readCompat(key, fallback = null) {
            return mapCompatRead(key, fallback);
        },

        writeCompat(key, value) {
            mapCompatWrite(key, value);
        },

        syncGet(key, fallback = null) {
            return mapCompatRead(key, fallback);
        },

        syncSet(key, value) {
            mapCompatWrite(key, value);
        }
    };

    global.DataAgent = DataAgent;

    DataAgent.init().catch(() => {
        // Data Agent still works through local fallback if init fails.
    });
})(window);
