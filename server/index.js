
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client('186299576876-htp2d7p6vstk8q5hqe4lahg6q6bgdpr0.apps.googleusercontent.com');

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import mammoth from 'mammoth';
import { getAgentDecision, buildUserState, recordQuizResults, getStoredUserState, updateStoredUserState } from './agent-engine.js';
import {
  getQuestionBankCatalog,
  queryQuestionBank,
  generateClassHeatmap,
  generateDoubtQuiz,
  buildAutoQuizQuestions,
  evaluateQuizSubmission,
  sanitizeQuizForStudent,
  normalizeQuizPayload,
  getQuestionMeta,
  loadQuestionMeta,
  batchUpdateQuestionMeta,
  getQuestionsByPriority,
  addCustomQuestion,
  getTopicStudentPerformance
} from './admin-quiz-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const Sentiment = require('sentiment');
const pdfParse = require('pdf-parse');
const execFileAsync = promisify(execFile);
const LOCAL_TESSDATA_PATH = path.join(__dirname, '..', 'node_modules', '@tesseract.js-data', 'eng', '4.0.0');

async function runOcr(buffer) {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng', 1, {
      langPath: LOCAL_TESSDATA_PATH,
      gzip: true,
    });
    const result = await worker.recognize(buffer);
    await worker.terminate();
    return String(result?.data?.text || '').slice(0, 12000);
  } catch (err) {
    console.error('[OCR] Failed:', err?.message || err);
    return '';
  }
}

async function rasterizePdfPage(buffer, pageNumber = 1) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tmpPdf = path.join(os.tmpdir(), `adapted-${stamp}.pdf`);
  const outPrefix = path.join(os.tmpdir(), `adapted-${stamp}`);
  const outPng = `${outPrefix}.png`;

  try {
    fs.writeFileSync(tmpPdf, buffer);
    await execFileAsync('pdftoppm', ['-f', String(pageNumber), '-singlefile', '-png', tmpPdf, outPrefix]);
    if (!fs.existsSync(outPng)) return null;
    return fs.readFileSync(outPng);
  } catch {
    return null;
  } finally {
    try { if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf); } catch {}
    try { if (fs.existsSync(outPng)) fs.unlinkSync(outPng); } catch {}
  }
}

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5050;
const JWT_SECRET = process.env.JWT_SECRET || 'adapted_dev_secret_2024';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024, files: 25 }
});

// ── Initialise AI Providers ───────────────────────────────────────────────────
let geminiModel = null;
let groqClient = null;

function initGemini() {
  if (!GEMINI_API_KEY) {
    console.log('⚠️ GEMINI_API_KEY not set — chatbot will use Groq/KB fallback.');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: GEMINI_CHAT_MODEL });
    console.log(`✅ Gemini initialized with ${GEMINI_CHAT_MODEL}!`);
  } catch (err) {
    console.error('❌ Gemini initialization failed:', err?.message || err);
  }
}

async function initGroq() {
  if (!GROQ_API_KEY) {
    console.log('⚠️ GROQ_API_KEY not set — Groq-dependent features will use fallback.');
    return;
  }

  const { Groq } = require("groq-sdk");
  groqClient = new Groq({ apiKey: GROQ_API_KEY });
  console.log('✅ Groq initialized with llama-3.1-8b-instant!');
}

initGemini();
initGroq().catch(() => {});

// ── Sentiment Analyser ────────────────────────────────────────────────────────
const sentimentAnalyser = new Sentiment();

// ── In-memory user store ──────────────────────────────────────────────────────
const users = new Map();

// ── Persistent storage ─────────────────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const adminStateFile = path.join(dataDir, 'admin-state.json');
const materialsDir = path.join(dataDir, 'materials');
if (!fs.existsSync(materialsDir)) fs.mkdirSync(materialsDir, { recursive: true });

const STUDENT_PERFORMANCE_LIMIT = 12000;


const defaultAdminState = {
  users: [],
  content: [
    { id: 'c1', title: 'Electrostatics Basics', subject: 'Physics', chapter: 'Electrostatics', difficulty: 'Medium', format: 'PDF', version: 3, status: 'Published' },
    { id: 'c2', title: 'Chemical Bonding Notes', subject: 'Chemistry', chapter: 'Bonding', difficulty: 'Easy', format: 'DOCX', version: 2, status: 'Draft' },
    { id: 'c3', title: 'Integration Tricks', subject: 'Math', chapter: 'Calculus', difficulty: 'Hard', format: 'TXT', version: 1, status: 'Review' }
  ],
  summaries: [
    { id: 's1', title: 'Electrostatics Quick Summary', contentId: 'c1', quality: 89, approved: true, downloads: 67, feedbackAvg: 4.4 },
    { id: 's2', title: 'Bonding Snapshot', contentId: 'c2', quality: 61, approved: false, downloads: 15, feedbackAvg: 3.1 },
    { id: 's3', title: 'Integration Revision', contentId: 'c3', quality: 48, approved: false, downloads: 7, feedbackAvg: 2.6 }
  ],
  aiQueue: [
    { id: 'q1', task: 'Summarize c2', type: 'Medium', status: 'queued', retries: 0 },
    { id: 'q2', task: 'Keyword extraction c3', type: 'Detailed', status: 'failed', retries: 1 }
  ],
  aiLogs: [
    { at: '10:22', item: 'c1', output: 'Strong conceptual clarity' },
    { at: '10:38', item: 'c2', output: 'Needs chapter examples' }
  ],
  categories: [
    { id: 'cat1', name: 'Physics', chapter: 'Mechanics', subtopic: 'Kinematics' },
    { id: 'cat2', name: 'Chemistry', chapter: 'Organic', subtopic: 'Hydrocarbons' },
    { id: 'cat3', name: 'Math', chapter: 'Algebra', subtopic: 'Quadratic' }
  ],
  feedback: [
    { id: 'f1', summaryId: 's1', rating: 5, comment: 'Very crisp and exam helpful' },
    { id: 'f2', summaryId: 's2', rating: 2, comment: 'Too generic' },
    { id: 'f3', summaryId: 's3', rating: 3, comment: 'Need more solved examples' }
  ],
  searchQueries: ['electrostatics formula sheet', 'integration by parts shortcut', 'neet cell cycle notes'],
  boosts: { formula: 0.8, exam: 0.6, revision: 0.75 },
  notifications: [
    { id: 'n1', title: 'New Physics Pack', body: 'Mechanics pack published', audience: 'all', at: 'today' }
  ],
  audit: [
    { at: '09:12', actor: 'System Admin', action: 'Changed role for Riya Nair' },
    { at: '09:48', actor: 'System Admin', action: 'Approved summary s1' }
  ],
  metrics: {
    activity: { daily: [22, 31, 17, 40, 36, 46, 28], weekly: [184, 210, 198, 243], monthly: [730, 870, 910, 1020] },
    apiUsage: [120, 130, 142, 156, 171, 165, 180],
    errorRate: [4.1, 3.8, 2.9, 3.1, 2.1, 2.4, 1.9],
    responseTime: [760, 700, 640, 620, 590, 610, 560],
    peakHours: [['8 AM', 20], ['12 PM', 56], ['6 PM', 81], ['9 PM', 63]],
    strugglingSubjects: [['Organic Chemistry', 74], ['Electromagnetics', 62], ['Differential Equations', 58]],
    summarizedChapters: [['Electrostatics', 121], ['Chemical Bonding', 98], ['Matrices', 77]]
  },
  backup: { lastBackup: 'Never', storageUsedMb: 512, storageLimitMb: 2048 },
  studentPerformance: [],
  doubtQuizzes: [],
  adminQuizzes: [],
  questionMeta: {}
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeTopicLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function ensureAdminExtensions(state) {
  const safe = asObject(state);
  if (!Array.isArray(safe.studentPerformance)) safe.studentPerformance = [];
  if (!Array.isArray(safe.doubtQuizzes)) safe.doubtQuizzes = [];
  if (!Array.isArray(safe.adminQuizzes)) safe.adminQuizzes = [];
  if (!Array.isArray(safe.users)) safe.users = [];
  if (!safe.questionMeta || typeof safe.questionMeta !== 'object') safe.questionMeta = {};
  return safe;
}

function normalizeStudentPerformanceRow(rawRow) {
  const row = asObject(rawRow);
  const userId = String(row.userId || row.email || '').trim();
  const topic = normalizeTopicLabel(row.topic);
  if (!userId || !topic) return null;

  const attempts = Math.max(1, Math.floor(toNumber(row.attempts, 1)));
  const correct = Math.max(0, Math.min(attempts, Math.floor(toNumber(row.correct, 0))));
  const accuracy = row.accuracy !== undefined
    ? Math.max(0, Math.min(1, toNumber(row.accuracy, 0)))
    : (attempts ? correct / attempts : 0);
  const timeTaken = Math.max(0, toNumber(row.timeTaken, 0));
  const source = (row.source === 'test' || row.source === 'quiz') ? row.source : 'quiz';

  return {
    userId,
    topic,
    correct,
    attempts,
    accuracy: Number(accuracy.toFixed(4)),
    timeTaken: Number(timeTaken.toFixed(2)),
    source,
    updatedAt: row.updatedAt || new Date().toISOString()
  };
}

function upsertStudentPerformanceRows(state, rows) {
  ensureAdminExtensions(state);
  const merged = new Map();

  for (const existingRaw of asArray(state.studentPerformance)) {
    const existing = normalizeStudentPerformanceRow(existingRaw);
    if (!existing) continue;
    merged.set(`${existing.userId}::${existing.topic}`, existing);
  }

  for (const rowRaw of asArray(rows)) {
    const row = normalizeStudentPerformanceRow(rowRaw);
    if (!row) continue;

    const key = `${row.userId}::${row.topic}`;
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, row);
      continue;
    }

    const attempts = prev.attempts + row.attempts;
    const correct = prev.correct + row.correct;
    const timeTaken = prev.timeTaken + row.timeTaken;
    const accuracy = attempts ? correct / attempts : 0;

    merged.set(key, {
      userId: row.userId,
      topic: row.topic,
      correct,
      attempts,
      accuracy: Number(accuracy.toFixed(4)),
      timeTaken: Number(timeTaken.toFixed(2)),
      updatedAt: new Date().toISOString()
    });
  }

  state.studentPerformance = Array.from(merged.values()).slice(-STUDENT_PERFORMANCE_LIMIT);
  return state.studentPerformance;
}

function normalizeAssignmentTargets(values) {
  const out = [];
  const seen = new Set();
  for (const raw of asArray(values)) {
    const text = String(raw || '').trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function getAssignedTargetsFromRole(role) {
  const wantedRole = String(role || 'Student').toLowerCase();
  return [...users.values()]
    .filter((user) => String(user.role || 'Student').toLowerCase() === wantedRole)
    .map((user) => user.id);
}

function resolveAssignmentTargets(payload = {}) {
  const base = normalizeAssignmentTargets(payload.userIds || payload.assignedTo || []);
  const includeRole = String(payload.role || payload.assignRole || '').trim();
  const assignAllStudents = !!payload.assignAllStudents;

  let roleTargets = [];
  if (assignAllStudents) {
    roleTargets = getAssignedTargetsFromRole('Student');
  } else if (includeRole) {
    roleTargets = getAssignedTargetsFromRole(includeRole);
  }

  return normalizeAssignmentTargets([...base, ...roleTargets]);
}

function isQuizAssignedToUser(quiz, user) {
  const assignedTo = normalizeAssignmentTargets(quiz?.assignedTo || []);
  if (!assignedTo.length) return false;
  const id = String(user?.id || '').toLowerCase();
  const email = String(user?.email || '').toLowerCase();

  return assignedTo.some((target) => {
    const key = target.toLowerCase();
    return key === id || key === email;
  });
}

function normalizeQuizType(value, fallback = 'AdminQuiz') {
  const key = String(value || '').toLowerCase();
  if (key === 'doubtquiz' || key === 'doubt' || key === 'doubt-quiz') return 'DoubtQuiz';
  if (key === 'adminquiz' || key === 'admin' || key === 'admin-quiz') return 'AdminQuiz';
  return fallback;
}

function getQuizCollection(state, quizType) {
  const normalized = normalizeQuizType(quizType);
  return normalized === 'DoubtQuiz' ? state.doubtQuizzes : state.adminQuizzes;
}

function findQuizByTypeAndId(state, quizType, quizId) {
  const list = getQuizCollection(state, quizType);
  const id = String(quizId || '').trim();
  return list.find((quiz) => String(quiz.id) === id) || null;
}

function upsertQuizInCollection(state, quiz) {
  const collection = getQuizCollection(state, quiz.type);
  const idx = collection.findIndex((row) => String(row.id) === String(quiz.id));
  if (idx >= 0) collection[idx] = quiz;
  else collection.unshift(quiz);
}

function parseCommaList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function quizListForType(state, quizType) {
  return normalizeQuizType(quizType) === 'DoubtQuiz'
    ? asArray(state.doubtQuizzes)
    : asArray(state.adminQuizzes);
}

function sanitizeQuizSummaryForStudent(quiz, quizType, userId) {
  const attempts = asArray(quiz?.attempts || []);
  const latestAttempt = attempts
    .filter((attempt) => String(attempt.userId || '') === String(userId || ''))
    .sort((a, b) => toNumber(b.submittedAt ? Date.parse(b.submittedAt) : 0, 0) - toNumber(a.submittedAt ? Date.parse(a.submittedAt) : 0, 0))[0] || null;

  return {
    id: quiz.id,
    quizType,
    title: quiz.title,
    topics: asArray(quiz.topics || []),
    questionCount: asArray(quiz.questions || []).length,
    difficulty: quiz.difficulty || 'medium',
    createdAt: quiz.createdAt,
    createdBy: quiz.createdBy,
    editable: !!quiz.editable,
    lastAttempt: latestAttempt
  };
}

function ensureJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readJsonFile(filePath, fallback) {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function normalizeRole(role, exam) {
  const roleText = (role || '').toLowerCase();
  const examText = (exam || '').toLowerCase();
  if (roleText === 'admin' || examText === 'admin') return 'Admin';
  if (roleText === 'premium') return 'Premium';
  return 'Student';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getUserByEmail(email) {
  return users.get(normalizeEmail(email));
}

function upsertUser(user) {
  const normalizedEmail = normalizeEmail(user?.email);
  if (!normalizedEmail) return null;
  const nextUser = { ...user, email: normalizedEmail };
  users.set(normalizedEmail, nextUser);
  return nextUser;
}

function ensureStorageReady() {
  ensureJsonFile(usersFile, []);
  ensureJsonFile(adminStateFile, defaultAdminState);
}

function loadUsersFromDisk() {
  users.clear();
  const storedUsers = readJsonFile(usersFile, []);
  storedUsers.forEach((u) => {
    upsertUser(u);
  });
}

function saveUsersToDisk() {
  writeJsonFile(usersFile, [...users.values()]);
}

function getAdminState() {
  const state = readJsonFile(adminStateFile, defaultAdminState);
  const safe = ensureAdminExtensions(state);
  // Hydrate QuestionMeta into the engine on each read
  loadQuestionMeta(safe.questionMeta);
  return safe;
}

function saveAdminState(state) {
  const safe = ensureAdminExtensions(state);
  // Persist current QuestionMeta back
  safe.questionMeta = getQuestionMeta();
  writeJsonFile(adminStateFile, safe);
}

function notificationVisibleToRole(notification, role) {
  const audience = String(notification?.audience || 'all').toLowerCase();
  const normalizedRole = String(role || 'Student').toLowerCase();
  if (audience === 'all') return true;
  if (audience === 'students') return normalizedRole === 'student';
  if (audience === 'premium') return normalizedRole === 'premium';
  if (audience === 'admins') return normalizedRole === 'admin';
  return true;
}

function syncAdminUser(user) {
  const state = getAdminState();
  const idx = (state.users || []).findIndex((u) => u.email === user.email);
  const profile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'Student',
    banned: !!user.banned,
    uploads: idx >= 0 ? state.users[idx].uploads || 0 : 0,
    summaries: idx >= 0 ? state.users[idx].summaries || 0 : 0,
    lastSeen: 'online'
  };
  if (!state.users) state.users = [];
  if (idx >= 0) state.users[idx] = profile;
  else state.users.push(profile);
  saveAdminState(state);
}

ensureStorageReady();
loadUsersFromDisk();


// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Serve static frontend files ──────────────────────────────────────────────
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir));
app.use('/materials', express.static(materialsDir));


// Root redirects to login
app.get('/', (req, res) => res.sendFile('login.html', { root: publicDir }));

// ── Auth middleware ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    req.user.email = normalizeEmail(req.user.email);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

function adminMiddleware(req, res, next) {
  const user = getUserByEmail(req.user.email);
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (user.banned) return res.status(403).json({ error: 'Account is banned' });
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
  req.adminUser = user;
  next();
}

function superAdminMiddleware(req, res, next) {
  const email = (req.adminUser?.email || '').toLowerCase();
  const superAdmins = ['superadmin@adapted.ai', 'owner@adapted.ai'];
  if (!superAdmins.includes(email)) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

app.get('/api/admin/ocr-health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng', 1, {
      langPath: LOCAL_TESSDATA_PATH,
      gzip: true,
    });
    await worker.terminate();
    res.json({ ok: true, tessdataPath: LOCAL_TESSDATA_PATH });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'OCR init failed', tessdataPath: LOCAL_TESSDATA_PATH });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, grade, stream, exam, role } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
  if (users.has(normalizedEmail)) return res.status(409).json({ error: 'An account with this email already exists' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now().toString(),
    name,
    email: normalizedEmail,
    role: normalizeRole(role, exam),
    banned: false,
    grade: grade || '11',
    stream: stream || 'PCM',
    passwordHash,
    createdAt: new Date().toISOString()
  };
  upsertUser(user);
  saveUsersToDisk();
  syncAdminUser(user);

  const { passwordHash: _p, ...safeUser } = user;
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: safeUser });
});



// Google Sign-In Route
app.post('/api/auth/google/signin', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '186299576876-htp2d7p6vstk8q5hqe4lahg6q6bgdpr0.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload.email);
    const name = payload.name;
    const picture = payload.picture;

    let user = getUserByEmail(email);
    if (!user) {
      // Return error if user does not exist but is trying to log in
      return res.status(401).json({ error: "No account found with this Google email. Please sign up first." });
    }

    const { passwordHash: _p, ...safeUser } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || 'Student' },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: safeUser });
  } catch (error) {
    console.error("Google verify error:", error);
    res.status(401).json({ error: "Invalid Google Token" });
  }
});

// Google Sign-Up Route
app.post('/api/auth/google/signup', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '186299576876-htp2d7p6vstk8q5hqe4lahg6q6bgdpr0.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
        const email = normalizeEmail(payload.email);
    const name = payload.name;

        let user = getUserByEmail(email);
    if (user) {
         // Proceed to login if user already exists
    } else {
        const generatedPasswordHash = await bcrypt.hash(Date.now().toString(), 10);
        user = {
            id: Date.now().toString(),
            name: name,
            email: email,
        role: 'Student',
        banned: false,
            grade: '11',
            stream: 'PCM',
            passwordHash: generatedPasswordHash,
            createdAt: new Date().toISOString()
        };
          user = upsertUser(user);
    }

    saveUsersToDisk();
    syncAdminUser(user);

    const { passwordHash: _p, ...safeUser } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || 'Student' },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error("Google signup error:", error);
    res.status(401).json({ error: "Invalid Google Token" });
  }
});

  // Log In
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = getUserByEmail(normalizedEmail);
  if (!user) return res.status(401).json({ error: 'No account found with this email' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  const { passwordHash: _p, ...safeUser } = user;
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safeUser });
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getUserByEmail(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _p, ...safeUser } = user;
  res.json(safeUser);
});

// Admin state (server-persisted)
app.get('/api/admin/state', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  const userProfiles = [...users.values()].map((u) => {
    const existing = (state.users || []).find((x) => x.email === u.email) || {};
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'Student',
      banned: !!u.banned,
      uploads: existing.uploads || 0,
      summaries: existing.summaries || 0,
      lastSeen: existing.lastSeen || 'online'
    };
  });

  state.users = userProfiles;
  saveAdminState(state);
  res.json(state);
});

app.get('/api/announcements', authMiddleware, (req, res) => {
  const state = getAdminState();
  const notifications = Array.isArray(state.notifications) ? state.notifications : [];
  const visible = notifications.filter((notification) => notificationVisibleToRole(notification, req.user?.role));
  res.json({ notifications: visible });
});

app.post('/api/admin/announcements', authMiddleware, adminMiddleware, (req, res) => {
  const { title, body, audience = 'all' } = req.body || {};
  const cleanTitle = String(title || '').trim();
  const cleanBody = String(body || '').trim();
  const cleanAudience = String(audience || 'all').toLowerCase();
  const allowedAudience = new Set(['all', 'students', 'premium', 'admins']);

  if (!cleanTitle || !cleanBody) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  if (!allowedAudience.has(cleanAudience)) {
    return res.status(400).json({ error: 'Invalid audience' });
  }

  const state = getAdminState();
  if (!Array.isArray(state.notifications)) state.notifications = [];

  const notice = {
    id: 'n' + Date.now(),
    title: cleanTitle,
    body: cleanBody,
    audience: cleanAudience,
    at: new Date().toLocaleDateString(),
    by: req.adminUser?.email || 'admin'
  };

  state.notifications.unshift(notice);
  saveAdminState(state);
  res.status(201).json({ ok: true, notice, notifications: state.notifications });
});

app.post('/api/performance/quiz', authMiddleware, (req, res) => {
  const authUser = getUserByEmail(req.user.email) || req.user;
  const userId = String(authUser?.id || req.user?.id || req.user?.email || '').trim();
  if (!userId) {
    return res.status(400).json({ error: 'Unable to resolve user identity' });
  }

  const payload = asObject(req.body);
  const providedBreakdown = asArray(payload.topicBreakdown);

  let rows = providedBreakdown.map((row) => ({ ...asObject(row), userId }));

  if (!rows.length) {
    const topic = normalizeTopicLabel(payload.topic || payload.subject || payload.quizTopic || 'general');
    const attempts = Math.max(1, Math.floor(toNumber(payload.attempts || payload.total, 1)));
    const scorePct = Math.max(0, Math.min(100, Math.round(toNumber(payload.score, 0))));
    const inferredCorrect = Math.round((scorePct / 100) * attempts);
    const correct = Math.max(0, Math.min(attempts, Math.floor(toNumber(payload.correct, inferredCorrect))));
    const accuracy = attempts ? correct / attempts : 0;
    rows = [{
      userId,
      topic,
      correct,
      attempts,
      accuracy,
      timeTaken: Math.max(0, toNumber(payload.timeTaken, 0))
    }];
  }

  const state = getAdminState();
  upsertStudentPerformanceRows(state, rows);
  saveAdminState(state);

  res.status(201).json({ ok: true, stored: rows.length });
});

app.get('/api/admin/heatmap', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  const heatmap = generateClassHeatmap(state.studentPerformance || []);
  res.json({
    heatmap,
    totalRows: asArray(state.studentPerformance).length,
    generatedAt: new Date().toISOString()
  });
});

app.get('/api/admin/question-bank', authMiddleware, adminMiddleware, (req, res) => {
  const topics = parseCommaList(req.query.topics).map((topic) => normalizeTopicLabel(topic));
  const difficulty = String(req.query.difficulty || 'all').toLowerCase();
  const search = String(req.query.search || '');
  const limit = Math.max(1, Math.min(200, Math.floor(toNumber(req.query.limit, 40))));

  const catalog = getQuestionBankCatalog();
  const questions = queryQuestionBank({ topics, difficulty, search, limit });
  res.json({ catalog, questions });
});

app.get('/api/admin/question-bank/replace', authMiddleware, adminMiddleware, (req, res) => {
  const topic = normalizeTopicLabel(req.query.topic || '');
  const difficulty = String(req.query.difficulty || 'all').toLowerCase();
  
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  // Exclude current set of questions to avoid duplicates in the same quiz
  const excludeIds = parseCommaList(req.query.excludeIds); 

  const questions = queryQuestionBank({ topics: [topic], difficulty, limit: 20 });
  const candidates = questions.filter(q => !excludeIds.includes(q.id));
  
  if (candidates.length === 0) {
    return res.status(404).json({ error: 'No replacement questions available for this topic/difficulty' });
  }

  // Shuffle candidate
  const randomIndex = Math.floor(Math.random() * candidates.length);
  res.json({ question: candidates[randomIndex] });
});

app.get('/api/admin/heatmap/topic/:topic/students', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  const topic = req.params.topic;
  if (!topic) return res.status(400).json({ error: 'Topic parameter missing' });

  const students = getTopicStudentPerformance(state.studentPerformance || [], topic);
  res.json({ students });
});

app.get('/api/admin/question-bank/meta', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  res.json({ meta: state.questionMeta || {} });
});

app.post('/api/admin/question-bank/add', authMiddleware, adminMiddleware, (req, res) => {
  const payload = asObject(req.body);
  if (!payload.question || !payload.topic) {
    return res.status(400).json({ error: 'question and topic are required' });
  }
  const question = addCustomQuestion(payload);
  const state = getAdminState();
  if (!Array.isArray(state.customQuestions)) state.customQuestions = [];
  state.customQuestions.push(question);
  saveAdminState(state);
  res.status(201).json({ ok: true, question });
});

app.get('/api/admin/quizzes', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  res.json({ quizzes: asArray(state.adminQuizzes) });
});

app.post('/api/admin/quizzes', authMiddleware, adminMiddleware, (req, res) => {
  const payload = asObject(req.body);
  const topics = parseCommaList(payload.topics).map((topic) => normalizeTopicLabel(topic));
  const questionCount = Math.max(3, Math.min(40, Math.floor(toNumber(payload.questionCount, 8))));
  const difficulty = String(payload.difficulty || 'medium').toLowerCase();
  const autoGenerate = !!payload.autoGenerate;

  let questions = asArray(payload.questions);
  if (!questions.length || autoGenerate) {
    questions = buildAutoQuizQuestions({
      topics,
      difficulty,
      questionCount,
      search: payload.search || ''
    });
  }

  if (!questions.length) {
    return res.status(400).json({ error: 'No questions available for the selected topics/difficulty' });
  }

  const quiz = normalizeQuizPayload({
    id: `aq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'AdminQuiz',
    title: String(payload.title || 'Admin Quiz').trim(),
    topics,
    difficulty,
    questions,
    assignedTo: resolveAssignmentTargets(payload),
    createdBy: req.adminUser?.email || 'admin',
    createdAt: new Date().toISOString(),
    editable: true,
    attempts: []
  }, { type: 'AdminQuiz' });

  if (!quiz.title) {
    return res.status(400).json({ error: 'Quiz title is required' });
  }

  if (!quiz.topics.length) {
    quiz.topics = [...new Set(asArray(quiz.questions).map((q) => normalizeTopicLabel(q.topic)).filter(Boolean))];
  }

  const state = getAdminState();
  upsertQuizInCollection(state, quiz);
  saveAdminState(state);

  res.status(201).json({ ok: true, quiz });
});

app.put('/api/admin/quizzes/:quizId', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  const existing = findQuizByTypeAndId(state, 'AdminQuiz', req.params.quizId);
  if (!existing) {
    return res.status(404).json({ error: 'Admin quiz not found' });
  }

  const payload = asObject(req.body);
  const topics = payload.topics !== undefined
    ? parseCommaList(payload.topics).map((topic) => normalizeTopicLabel(topic))
    : existing.topics;
  const autoGenerate = !!payload.autoGenerate;
  const questionCount = Math.max(3, Math.min(40, Math.floor(toNumber(payload.questionCount, asArray(existing.questions).length || 8))));
  const difficulty = String(payload.difficulty || existing.difficulty || 'medium').toLowerCase();

  let nextQuestions = payload.questions !== undefined ? asArray(payload.questions) : existing.questions;
  if (autoGenerate) {
    nextQuestions = buildAutoQuizQuestions({
      topics,
      difficulty,
      questionCount,
      search: payload.search || ''
    });
  }

  const assignmentRequested = payload.assignedTo !== undefined
    || payload.userIds !== undefined
    || payload.assignAllStudents !== undefined
    || payload.role !== undefined
    || payload.assignRole !== undefined;

  const updated = normalizeQuizPayload({
    ...existing,
    ...payload,
    id: existing.id,
    type: 'AdminQuiz',
    title: payload.title !== undefined ? String(payload.title).trim() : existing.title,
    topics,
    difficulty,
    questions: nextQuestions,
    assignedTo: assignmentRequested ? resolveAssignmentTargets(payload) : existing.assignedTo,
    createdBy: existing.createdBy,
    createdAt: existing.createdAt,
    editable: true,
    attempts: existing.attempts
  }, existing);

  upsertQuizInCollection(state, updated);
  saveAdminState(state);
  res.json({ ok: true, quiz: updated });
});

app.post('/api/admin/quizzes/:quizId/assign', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  const quiz = findQuizByTypeAndId(state, 'AdminQuiz', req.params.quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Admin quiz not found' });
  }

  const payload = asObject(req.body);
  const mode = String(payload.mode || 'append').toLowerCase();
  const targets = resolveAssignmentTargets(payload);
  if (!targets.length) {
    return res.status(400).json({ error: 'No valid assignment targets provided' });
  }

  const base = mode === 'replace' ? [] : normalizeAssignmentTargets(quiz.assignedTo || []);
  const nextAssigned = normalizeAssignmentTargets([...base, ...targets]);

  const updated = normalizeQuizPayload({
    ...quiz,
    type: 'AdminQuiz',
    assignedTo: nextAssigned,
    attempts: quiz.attempts
  }, quiz);

  upsertQuizInCollection(state, updated);
  saveAdminState(state);
  res.json({ ok: true, assignedTo: nextAssigned, quiz: updated });
});

app.get('/api/admin/doubt-quizzes', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  res.json({ quizzes: asArray(state.doubtQuizzes) });
});

app.post('/api/admin/doubt-quizzes/generate', authMiddleware, adminMiddleware, (req, res) => {
  const payload = asObject(req.body);
  const state = getAdminState();
  const selectedTopics = parseCommaList(payload.selectedTopics || payload.topics)
    .map((topic) => normalizeTopicLabel(topic));
  const questionCount = Math.max(3, Math.min(30, Math.floor(toNumber(payload.questionCount, 8))));

  const generated = generateDoubtQuiz({
    selectedTopics,
    questionCount,
    title: payload.title || 'Doubt Quiz',
    createdBy: req.adminUser?.email || 'admin',
    assignedTo: resolveAssignmentTargets(payload),
    studentPerformance: state.studentPerformance || []
  });

  const quiz = normalizeQuizPayload({
    ...generated,
    type: 'DoubtQuiz',
    editable: true,
    attempts: []
  }, { type: 'DoubtQuiz' });

  upsertQuizInCollection(state, quiz);
  saveAdminState(state);
  res.status(201).json({ ok: true, quiz });
});

app.get('/api/admin/doubt-quizzes/suggest', authMiddleware, adminMiddleware, (req, res) => {
  const topics = parseCommaList(req.query.topic).map((topic) => normalizeTopicLabel(topic));
  const count = Math.max(3, Math.min(30, Math.floor(toNumber(req.query.count, 8))));
  if (!topics.length) return res.status(400).json({ error: 'Topics required' });

  const questions = getQuestionsByPriority(topics, count);
  res.json({ questions });
});

app.put('/api/admin/doubt-quizzes/:quizId', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  const existing = findQuizByTypeAndId(state, 'DoubtQuiz', req.params.quizId);
  if (!existing) {
    return res.status(404).json({ error: 'Doubt quiz not found' });
  }

  const payload = asObject(req.body);
  const topics = payload.topics !== undefined
    ? parseCommaList(payload.topics).map((topic) => normalizeTopicLabel(topic))
    : existing.topics;
  const assignmentRequested = payload.assignedTo !== undefined
    || payload.userIds !== undefined
    || payload.assignAllStudents !== undefined
    || payload.role !== undefined
    || payload.assignRole !== undefined;

  const updated = normalizeQuizPayload({
    ...existing,
    ...payload,
    id: existing.id,
    type: 'DoubtQuiz',
    title: payload.title !== undefined ? String(payload.title).trim() : existing.title,
    topics,
    assignedTo: assignmentRequested ? resolveAssignmentTargets(payload) : existing.assignedTo,
    createdBy: existing.createdBy,
    createdAt: existing.createdAt,
    editable: true,
    attempts: existing.attempts
  }, existing);

  upsertQuizInCollection(state, updated);
  saveAdminState(state);
  res.json({ ok: true, quiz: updated });
});

app.post('/api/admin/doubt-quizzes/:quizId/assign', authMiddleware, adminMiddleware, (req, res) => {
  const state = getAdminState();
  const quiz = findQuizByTypeAndId(state, 'DoubtQuiz', req.params.quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Doubt quiz not found' });
  }

  const payload = asObject(req.body);
  const mode = String(payload.mode || 'append').toLowerCase();
  const targets = resolveAssignmentTargets(payload);
  if (!targets.length) {
    return res.status(400).json({ error: 'No valid assignment targets provided' });
  }

  const base = mode === 'replace' ? [] : normalizeAssignmentTargets(quiz.assignedTo || []);
  const nextAssigned = normalizeAssignmentTargets([...base, ...targets]);

  const updated = normalizeQuizPayload({
    ...quiz,
    type: 'DoubtQuiz',
    assignedTo: nextAssigned,
    attempts: quiz.attempts
  }, quiz);

  upsertQuizInCollection(state, updated);
  saveAdminState(state);
  res.json({ ok: true, assignedTo: nextAssigned, quiz: updated });
});

app.get('/api/quiz/assigned', authMiddleware, (req, res) => {
  const authUser = getUserByEmail(req.user.email) || req.user;
  const state = getAdminState();

  const adminAssigned = quizListForType(state, 'AdminQuiz')
    .filter((quiz) => isQuizAssignedToUser(quiz, authUser))
    .map((quiz) => sanitizeQuizSummaryForStudent(quiz, 'AdminQuiz', authUser.id));

  const doubtAssigned = quizListForType(state, 'DoubtQuiz')
    .filter((quiz) => isQuizAssignedToUser(quiz, authUser))
    .map((quiz) => sanitizeQuizSummaryForStudent(quiz, 'DoubtQuiz', authUser.id));

  const quizzes = [...adminAssigned, ...doubtAssigned].sort((a, b) => {
    const at = Date.parse(a.createdAt || 0) || 0;
    const bt = Date.parse(b.createdAt || 0) || 0;
    return bt - at;
  });

  res.json({ quizzes });
});

app.get('/api/quiz/assigned/:quizType/:quizId', authMiddleware, (req, res) => {
  const authUser = getUserByEmail(req.user.email) || req.user;
  const state = getAdminState();
  const quizType = normalizeQuizType(req.params.quizType);
  const quiz = findQuizByTypeAndId(state, quizType, req.params.quizId);

  if (!quiz) {
    return res.status(404).json({ error: 'Assigned quiz not found' });
  }

  if (!isQuizAssignedToUser(quiz, authUser)) {
    return res.status(403).json({ error: 'Quiz is not assigned to this user' });
  }

  const publicQuiz = sanitizeQuizForStudent(quiz);
  res.json({ quiz: { ...publicQuiz, quizType } });
});

app.post('/api/quiz/assigned/:quizType/:quizId/submit', authMiddleware, (req, res) => {
  const authUser = getUserByEmail(req.user.email) || req.user;
  const userId = String(authUser?.id || req.user?.id || '').trim();
  if (!userId) {
    return res.status(400).json({ error: 'Unable to resolve user id' });
  }

  const state = getAdminState();
  const quizType = normalizeQuizType(req.params.quizType);
  const quiz = findQuizByTypeAndId(state, quizType, req.params.quizId);

  if (!quiz) {
    return res.status(404).json({ error: 'Assigned quiz not found' });
  }

  if (!isQuizAssignedToUser(quiz, authUser)) {
    return res.status(403).json({ error: 'Quiz is not assigned to this user' });
  }

  const payload = asObject(req.body);
  const answers = asArray(payload.answers);
  const timeTaken = Math.max(0, toNumber(payload.timeTaken, 0));

  const result = evaluateQuizSubmission(quiz, answers, timeTaken);
  const attempt = {
    userId,
    userEmail: String(authUser?.email || req.user?.email || ''),
    score: result.score,
    correct: result.correct,
    total: result.total,
    weakAreas: result.weakAreas,
    wrongQuestionIds: result.wrongQuestionIds,
    topicBreakdown: result.topicBreakdown,
    submittedAt: new Date().toISOString(),
    timeTaken
  };

  const nextAttempts = [...asArray(quiz.attempts), attempt].slice(-500);
  const updatedQuiz = normalizeQuizPayload({
    ...quiz,
    type: quizType,
    attempts: nextAttempts
  }, quiz);

  upsertQuizInCollection(state, updatedQuiz);
  const perfRows = asArray(result.topicBreakdown).map((row) => ({
    ...row,
    userId,
    source: 'quiz'
  }));
  upsertStudentPerformanceRows(state, perfRows);

  // Update QuestionMeta with per-question results
  if (result.perQuestionResults) {
    batchUpdateQuestionMeta(result.perQuestionResults);
  }

  saveAdminState(state);

  try {
    recordQuizResults(
      userId,
      quizType,
      normalizeTopicLabel(asArray(updatedQuiz.topics)[0] || result.topicBreakdown?.[0]?.topic || 'general'),
      result.score / 100,
      asArray(result.weakAreas).map((topic) => ({ topic, concept: topic }))
    );
  } catch (err) {
    console.warn('[Assigned Quiz] Failed to update agent-state:', err?.message || err);
  }

  res.json({ ok: true, quizId: updatedQuiz.id, quizType, result, attempt });
});

app.put('/api/admin/state', authMiddleware, adminMiddleware, (req, res) => {
  const next = req.body;
  if (!next || typeof next !== 'object') {
    return res.status(400).json({ error: 'Invalid admin state payload' });
  }

  const current = getAdminState();
  const merged = ensureAdminExtensions({
    ...current,
    ...next,
    users: Array.isArray(next.users) ? next.users : current.users,
    studentPerformance: Array.isArray(next.studentPerformance) ? next.studentPerformance : current.studentPerformance,
    doubtQuizzes: Array.isArray(next.doubtQuizzes) ? next.doubtQuizzes : current.doubtQuizzes,
    adminQuizzes: Array.isArray(next.adminQuizzes) ? next.adminQuizzes : current.adminQuizzes,
  });

  if (!Array.isArray(merged.users)) merged.users = [];

  // Sync role/ban changes to auth users store.
  merged.users.forEach((u) => {
    if (!u || !u.email) return;
    const authUser = getUserByEmail(u.email);
    if (!authUser) return;
    authUser.role = normalizeRole(u.role, u.exam);
    authUser.banned = !!u.banned;
    upsertUser(authUser);
  });
  saveUsersToDisk();

  saveAdminState(merged);
  res.json({ ok: true });
});

app.post('/api/admin/critical-action', authMiddleware, adminMiddleware, superAdminMiddleware, (req, res) => {
  const state = getAdminState();
  const now = new Date();
  const at = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (!Array.isArray(state.audit)) state.audit = [];
  state.audit.unshift({
    at,
    actor: req.adminUser.name,
    action: 'Executed critical policy update'
  });
  saveAdminState(state);
  res.json({ ok: true, message: 'Critical action completed' });
});

function buildFallbackSummaryPreview(item, level = 'medium') {
  const title = item.title || 'Untitled material';
  const subject = item.subject || 'General';
  const chapter = item.chapter || 'General chapter';
  const difficulty = item.difficulty || 'Medium';
  const format = item.format || 'TXT';

  const depth = String(level || 'medium').toLowerCase();
  const tone = depth === 'short'
    ? 'Quick revision snapshot'
    : depth === 'detailed'
      ? 'Detailed exam-ready summary'
      : 'Balanced conceptual summary';

  const text = String(item.text || '').replace(/\s+/g, ' ').trim();
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25)
    .slice(0, depth === 'detailed' ? 4 : depth === 'short' ? 1 : 2);

  const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'have', 'your', 'are', 'was', 'were', 'can', 'will', 'not', 'but', 'you', 'all', 'any', 'has', 'had', 'its', 'their', 'they', 'them', 'his', 'her', 'our', 'about', 'each', 'more', 'than', 'also']);
  const freq = {};
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  const summaryLead = sentences.length
    ? sentences.join(' ')
    : `${title} focuses on ${chapter} in ${subject} with ${difficulty} level coverage.`;

  const extractionNote = text.length
    ? ''
    : '\n- Note: Could not extract readable text from this file. If this is a scanned PDF/image, OCR is required for deeper summarization.';

  return `${title}\n${tone}\n- Subject: ${subject}\n- Chapter: ${chapter}\n- Difficulty: ${difficulty}\n- Source format: ${format}\n- Summary: ${summaryLead}\n- Key terms: ${keywords.length ? keywords.join(', ') : 'core concepts, examples, formulas'}\n- Practice focus: 3 likely exam-style questions${extractionNote}`;
}

async function extractTextFromUploadedFile(file) {
  if (!file || !file.buffer) return '';
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'].includes(ext);

  try {
    if (ext === '.txt') {
      return file.buffer.toString('utf-8').slice(0, 12000);
    }
    if (ext === '.pdf') {
      const parsed = await pdfParse(file.buffer);
      const text = String(parsed.text || '').slice(0, 12000).trim();
      if (text.length > 80) return text;
      // Likely scanned/image-only PDF: OCR first 3 pages (covers often have no text).
      let combined = '';
      for (let page = 1; page <= 3; page++) {
        const pagePng = await rasterizePdfPage(file.buffer, page);
        if (!pagePng) continue;
        const pageText = (await runOcr(pagePng)).trim();
        if (pageText.length > 40) {
          combined += `\n${pageText}`;
        }
        if (combined.length > 1600) break;
      }
      return combined.slice(0, 12000).trim();
    }
    if (ext === '.docx') {
      const parsed = await mammoth.extractRawText({ buffer: file.buffer });
      return String(parsed.value || '').slice(0, 12000);
    }
    if (isImage) {
      return await runOcr(file.buffer);
    }
  } catch {
    return '';
  }

  return '';
}

app.post('/api/admin/preview-summaries', authMiddleware, adminMiddleware, async (req, res) => {
  const { items = [], level = 'medium' } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const previews = [];

  for (const rawItem of items.slice(0, 25)) {
    const item = {
      title: rawItem?.title || 'Untitled material',
      subject: rawItem?.subject || 'General',
      chapter: rawItem?.chapter || 'General chapter',
      difficulty: rawItem?.difficulty || 'Medium',
      format: rawItem?.format || 'TXT'
    };

    let preview = '';

    if (groqClient) {
      try {
        const prompt = `Generate a ${level} admin summary preview for study material. Keep it concise, exam-oriented, and in bullet-like plain text.
Title: ${item.title}
Subject: ${item.subject}
Chapter: ${item.chapter}
Difficulty: ${item.difficulty}
      Format: ${item.format}
      Extracted text (if available): ${(rawItem?.text || '').slice(0, 4000)}`;
        const result = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
        preview = (result.choices[0]?.message?.content || '').trim();
      } catch {
        preview = '';
      }
    }

    if (!preview) {
      preview = buildFallbackSummaryPreview(item, level);
    }

    previews.push({ title: item.title, preview, url: item.url });
  }

  res.json({ previews });
});

app.post('/api/admin/upload-file', authMiddleware, adminMiddleware, uploadMemory.single('contentFile'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  fs.writeFileSync(path.join(materialsDir, filename), req.file.buffer);
  res.json({ url: `/materials/${filename}` });
});

app.post('/api/admin/preview-upload', authMiddleware, adminMiddleware, uploadMemory.array('files', 25), async (req, res) => {
  const files = req.files || [];
  const level = String(req.body.level || 'medium');
  let meta = [];
  try {
    meta = JSON.parse(req.body.meta || '[]');
  } catch {
    meta = [];
  }

  if (!files.length) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const previews = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const m = meta[i] || {};
    const text = await extractTextFromUploadedFile(file);
      const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      fs.writeFileSync(path.join(materialsDir, filename), file.buffer);
      const url = `/materials/${filename}`;
    const item = {
      title: m.title || file.originalname.replace(/\.[^.]+$/, ''),
      subject: m.subject || 'General',
      chapter: m.chapter || 'Bulk Import',
      difficulty: m.difficulty || 'Medium',
      format: m.format || path.extname(file.originalname || '').replace('.', '').toUpperCase() || 'TXT',
      text,
        url,
    };

    let preview = '';
    if (groqClient) {
      try {
        const prompt = `Create a ${level} summary preview for admin moderation from this content.
Title: ${item.title}
Subject: ${item.subject}
Chapter: ${item.chapter}
Difficulty: ${item.difficulty}
Text: ${item.text.slice(0, 5050)}`;
        const result = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
        preview = (result.choices[0]?.message?.content || '').trim();
      } catch {
        preview = '';
      }
    }

    if (!preview) {
      preview = buildFallbackSummaryPreview(item, level);
    }

    previews.push({ title: item.title, preview, url: item.url });
  }

  res.json({ previews });
});

// ── Emotion detection ────────────────────────────────────────────────────────
const emotionKeywords = {
  frustrated: ['don\'t understand', 'difficult', 'hard', 'stuck', 'frustrated', 'can\'t', 'unable', 'impossible', 'struggling', 'hate', 'useless', 'give up', 'quit', 'done with'],
  anxious: ['worried', 'nervous', 'anxious', 'scared', 'fear', 'exam', 'test', 'pressure', 'stressed', 'overwhelmed', 'panic', 'tomorrow', 'deadline'],
  confused: ['what is', 'how does', 'why does', 'explain', 'not clear', 'unclear', 'don\'t get', 'lost', "don't know", 'confused', 'help me understand'],
  confident: ['got it', 'understand', 'clear', 'easy', 'thanks', 'great', 'awesome', 'perfect', 'excellent', 'i see', 'makes sense', 'thank you'],
  sad: ['sad', 'depressed', 'lonely', 'alone', 'cry', 'crying', 'miss', 'hurt', 'pain', 'terrible', 'awful', 'worst', 'broken', 'hopeless', 'worthless', 'nobody', 'no one'],
  tired: ['tired', 'exhausted', 'sleep', 'sleepy', 'burnout', 'burnt out', 'no energy', 'drained', 'fatigue', 'rest', 'wanna sleep', 'so tired', 'can\'t focus'],
  happy: ['happy', 'excited', 'amazing', 'wonderful', 'love', 'best', 'yay', 'fun', 'good day', 'proud', 'achieved', 'celebrate'],
  angry: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'pissed', 'unfair', 'stupid', 'ridiculous', 'ugh'],
};

function ruleBasedEmotion(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    scores[emotion] = 0;
    for (const kw of keywords) if (lower.includes(kw)) scores[emotion]++;
  }
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'neutral';
  return Object.keys(scores).find(k => scores[k] === maxScore);
}

// ── Emotional Support Responses (offline fallback) ──────────────────────────
const emotionalReplies = {
  tired: [
    "I hear you — you sound really drained. It's okay to feel tired, especially when you've been working hard. 💤\n\nHere's what I'd suggest:\n\n🛏️ **Take a 20-minute power nap** — it recharges your brain without making you groggy\n☕ Drink some water (dehydration makes tiredness worse)\n🎵 Put on some light music and close your eyes for 5 minutes\n\nRemember: Rest is not laziness. Your brain needs downtime to absorb what you've studied. Take care of yourself first — the books will still be there when you're refreshed! 🌙",
    "Feeling exhausted is your body's way of saying 'I need a break' — and that's totally valid. 😊\n\nSome quick energy boosters:\n• Splash cold water on your face\n• Do 10 jumping jacks (sounds silly, but it works!)\n• Step outside for 2 minutes of fresh air\n• Have a healthy snack — fruits or nuts\n\nIf you're consistently burnt out, consider adjusting your study schedule. Quality > quantity every time. You've got this! 💪",
  ],
  sad: [
    "I'm really sorry you're feeling this way. It's okay to feel sad — you don't have to pretend everything's fine. 💙\n\nHere are some things that might help:\n\n🗣️ **Talk to someone** — a friend, family member, or school counselor. You don't have to carry this alone.\n📝 Write down what's bothering you — sometimes putting feelings on paper makes them feel lighter\n🌈 Remember: This feeling is temporary. Bad days don't mean a bad life.\n\nI'm always here if you want to talk or just need a distraction. Would you like me to help with some studying to take your mind off things, or would you prefer to just chat? 💛",
    "Hey, I can sense something's weighing on you, and I want you to know — it's completely okay to not be okay. 🤗\n\nSome gentle suggestions:\n• Take a moment to breathe deeply — 4 seconds in, hold 4, out 4\n• Listen to a song that makes you feel understood\n• Remember a time when things felt hard but you got through it\n\nYou're stronger than you think. And if things feel really heavy, please reach out to a trusted adult or call a helpline. You matter more than any exam. 💜",
  ],
  frustrated: [
    "I can feel your frustration, and honestly? That frustration means you care about doing well — and that's a strength. 💪\n\nLet's channel that energy:\n\n1. 🧊 **Pause for 60 seconds** — frustration clouds thinking\n2. 🔍 **Identify the exact thing** that's frustrating you — is it a concept, a problem type, or the volume?\n3. 📚 **Break it down** — tell me what you're stuck on and I'll explain it differently\n\nRemember: Every expert was once a complete beginner. You're learning, not failing. Let's figure this out together! 🌟",
    "Ugh, I know that feeling of wanting to throw the textbook! 😤 But here's the thing — being frustrated means you're pushing your boundaries, and that's exactly where growth happens.\n\n🔑 Quick reset:\n• Close the book for 5 minutes\n• Do something physical — even a short walk\n• Come back and tell me the specific topic. I'll break it down so simply it'll click.\n\nWhat's the topic that's giving you trouble? Let's tackle it head-on! 💥",
  ],
  anxious: [
    "I can feel the anxiety in your message, and first — take a deep breath. Seriously, right now. In... and out... 🌊\n\n📋 **Anti-anxiety game plan:**\n1. **Write down** everything that's worrying you\n2. **Circle** what you can actually control\n3. **Make a tiny plan** for just the next 2 hours\n\nThe feeling of being overwhelmed usually comes from looking at everything at once. Break it into small, manageable chunks.\n\n💡 Remember: Lakhs of students have felt exactly what you're feeling right now — and they got through it. You will too. What can I help you prepare for right now?",
    "Exam stress is SO real, and your feelings are completely valid. But here's a truth bomb: **anxiety lies to you**. It tells you you're not ready, but let's look at the facts. 🎯\n\n🧠 Studies show that some stress actually IMPROVES performance. Your body is gearing up to do its best.\n\nHere's how to use it:\n• Convert worry → preparation (study the weakest topic first)\n• Practice papers > re-reading notes (active recall is 3x more effective)\n• Sleep 7+ hours (your brain consolidates memory while you sleep!)\n\nWhat subject are you most worried about? Let's make a quick revision plan! 📝",
  ],
  angry: [
    "I can tell you're really frustrated right now, and that's okay — anger is a valid emotion. 🔥\n\nBefore we go further:\n1. Take 3 deep breaths\n2. Clench your fists tight... and release\n3. Ask yourself: 'Will this matter in 5 years?'\n\nNow — what's making you angry? Sometimes just venting helps. I'm here to listen without judgment. And if it's study-related, I promise we can find a way to make it less annoying! 😊\n\nRemember: It's okay to feel angry. It's what you do with that energy that matters. Let's turn it into fuel! 💪",
  ],
  happy: [
    "That's amazing! I love seeing you in such a great mood! 🎉✨\n\nThis is the PERFECT time to:\n• 📚 Tackle a challenging topic (happy brain = productive brain!)\n• 📝 Review something you've been putting off\n• 🎯 Set a new study goal\n\nRide this wave of positive energy! What would you like to learn or revise today? 🚀",
    "Your energy is contagious! 😄🌟\n\nFun fact: You learn 20% better when you're in a positive mood. So let's make the most of it!\n\nWant to:\n• Master a new concept? 🧠\n• Practice some challenging problems? 💪\n• Or just chat about something cool in science? 🔬\n\nThe floor is yours! What shall we do? 🎯",
  ],
  confident: [
    "Love that confidence! You're clearly putting in the work, and it shows! 🌟\n\nLet's keep the momentum going. Would you like to:\n• Level up with harder problems? 🎯\n• Learn something completely new? 🧠\n• Help solidify what you know by teaching it (explaining a concept is the best way to learn it)? 📚\n\nWhat topic are you feeling great about?",
  ],
  neutral: [
    "Hey there! 😊 I'm LearnBot — your study buddy and emotional support companion.\n\nI'm here for whatever you need:\n• 📚 **Study help** — explain concepts, solve problems, revision tips\n• 💬 **Just chat** — talk about how your day's going\n• 🧘 **Emotional support** — feeling stressed, anxious, tired? I'm here to listen\n• 🎯 **Motivation** — need a pep talk before an exam?\n\nWhat's on your mind?",
    "Hi! Ready for whatever you need today 😊\n\nI can help with:\n• Physics, Chemistry, Math, Biology concepts\n• Exam preparation & study strategies\n• Dealing with stress, anxiety, or tiredness\n• Just being someone to talk to\n\nWhat would you like to chat about?",
  ],
  confused: [
    "No worries at all — confusion is literally the first step of learning! 🧩\n\nI'm here to help make things clear. What topic or concept is giving you trouble? The more specific you are, the better I can help!\n\nTip: Try saying something like:\n• 'Explain Newton's third law simply'\n• 'I don't get the mole concept'\n• 'How do quadratic equations work?'\n\nOr if it's not about studies — just tell me what's on your mind! 💬",
  ],
};

function emotionalFallbackReply(emotion) {
  const pool = emotionalReplies[emotion] || emotionalReplies.neutral;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Academic Knowledge Base (for offline mode) ──────────────────────────────
const KB = [
  // Physics
  { tags: ['newton', 'first law', 'inertia'], answer: `Newton's First Law (Inertia): An object stays at rest or in uniform motion unless acted on by a net external force.\n\n🔑 Inertia = resistance to change in motion. More mass = more inertia.\n📝 Bus braking → passengers lurch forward (inertia). No net force → no change in velocity.` },
  { tags: ['newton', 'second law', 'f=ma', 'force and acceleration'], answer: `Newton's Second Law: F = ma\n\nNet Force = Mass × Acceleration. Force and acceleration are in the same direction.\n📝 Push 2 kg with 10 N → a = 5 m/s². Always draw a free-body diagram first!` },
  { tags: ['newton', 'third law', 'action', 'reaction'], answer: `Newton's Third Law: Every action has an equal and opposite reaction (F₁₂ = -F₂₁).\n\n🔑 Action & reaction act on DIFFERENT objects — that's why they don't cancel!\n📝 You push wall → wall pushes you. Rocket pushes gas down → gas pushes rocket up.` },
  { tags: ['gravity', 'gravitational', 'weight', 'free fall'], answer: `Gravitation: F = Gm₁m₂/r² (G = 6.67×10⁻¹¹)\n\ng = 9.8 m/s², Weight = mg, Escape velocity = √(2gR) = 11.2 km/s\nFree fall: acceleration = g downward, independent of mass.` },
  { tags: ['work', 'energy', 'power', 'kinetic', 'potential'], answer: `Work = F·d·cosθ | KE = ½mv² | PE = mgh\nWork-Energy Theorem: W_net = ΔKE\nPower = W/t = F·v\nConservation: KE + PE = constant (no friction)` },
  { tags: ['ohm', 'resistance', 'current', 'voltage', 'circuit', 'kirchhoff'], answer: `Ohm's Law: V = IR\nSeries: R_total = R₁+R₂+... | Parallel: 1/R = 1/R₁+1/R₂+...\nPower: P = VI = I²R = V²/R\nKCL: ΣI_in = ΣI_out | KVL: ΣV around loop = 0` },
  { tags: ['wave', 'sound', 'frequency', 'wavelength'], answer: `Waves: v = fλ\nTransverse: oscillation ⊥ wave direction | Longitudinal: ∥\nSound ≈ 343 m/s in air, needs medium. Doppler: moving toward → higher frequency.` },
  // Chemistry
  { tags: ['mole', 'avogadro', 'molar', 'molarity'], answer: `1 mole = 6.022×10²³ particles\nMoles = mass/molar mass | Molarity = moles/litres\nH=1, C=12, N=14, O=16, Na=23, Cl=35.5` },
  { tags: ['periodic table', 'periodic', 'electron configuration', 'valence'], answer: `Trends L→R: Atomic radius↓, IE↑, EN↑, Metallic↓\nTrends T→B: Opposite\nF = most electronegative (4.0)` },
  { tags: ['acid', 'base', 'ph level', 'ph value', 'buffer', 'neutralization', 'arrhenius'], answer: `pH = -log[H⁺] | pH + pOH = 14\nStrong acids: HCl, HBr, HI, H₂SO₄, HNO₃, HClO₄\nBuffer pH = pKa + log([A⁻]/[HA])` },
  { tags: ['organic', 'iupac', 'alkane', 'alkene', 'alkyne', 'functional group', 'hydrocarbon'], answer: `Alkane CₙH₂ₙ₊₂ | Alkene CₙH₂ₙ | Alkyne CₙH₂ₙ₋₂\nGroups: -OH (alcohol), -CHO (aldehyde), -COOH (acid), -NH₂ (amine)\nIUPAC: Find longest chain → number → name substituents` },

  // Math
  { tags: ['quadratic', 'quadratic formula', 'discriminant', 'roots'], answer: `ax²+bx+c=0 → x = (-b±√(b²-4ac))/2a\nD>0: 2 real roots | D=0: 1 repeated | D<0: complex\nSum = -b/a, Product = c/a` },
  { tags: ['trigonometry', 'trig', 'sin', 'cos', 'tan', 'identity'], answer: `sin²θ+cos²θ=1 | sin2θ=2sinθcosθ | cos2θ=cos²θ-sin²θ\nsin(A+B)=sinAcosB+cosAsinB | CAST rule for quadrant signs` },
  { tags: ['derivative', 'differentiation', 'calculus', 'integration', 'integral'], answer: `d/dx(xⁿ)=nxⁿ⁻¹ | ∫xⁿdx=xⁿ⁺¹/(n+1)+C\nChain: d/dx[f(g(x))]=f'·g' | By-parts: ∫udv=uv-∫vdu (ILATE)` },
  { tags: ['probability', 'permutation', 'combination', 'bayes'], answer: `ⁿPᵣ=n!/(n-r)! | ⁿCᵣ=n!/[r!(n-r)!]\nP(A∪B)=P(A)+P(B)-P(A∩B) | Bayes: P(A|B)=P(B|A)·P(A)/P(B)` },

  // Biology
  { tags: ['cell', 'mitosis', 'meiosis', 'cell division'], answer: `Mitosis: 2n→2n, 2 identical cells (growth)\nMeiosis: 2n→n, 4 different haploid cells (gametes)\nCrossing over in Prophase I → genetic variation` },
  { tags: ['photosynthesis', 'calvin cycle', 'chlorophyll', 'light reaction'], answer: `6CO₂+6H₂O+light→C₆H₁₂O₆+6O₂\nLight (thylakoid): ATP+NADPH+O₂ | Dark/Calvin (stroma): CO₂→glucose\nC3 (rice) vs C4 (sugarcane) — C4 has no photorespiration` },
  { tags: ['dna', 'rna', 'replication', 'transcription', 'translation', 'codon'], answer: `Central Dogma: DNA→mRNA→Protein\nA-T (2 H-bonds), G-C (3 H-bonds) | Replication: semi-conservative\nStart: AUG | Stop: UAA, UAG, UGA | Code is universal & degenerate` },
];

function kbLookup(message) {
  const lower = message.toLowerCase();
  let bestMatch = null, bestScore = 0;
  for (const entry of KB) {
    const score = entry.tags.filter(tag => {
      if (tag.length <= 3) return new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower);
      return lower.includes(tag);
    }).length;
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }
  return bestMatch && bestScore >= 1 ? bestMatch.answer : null;
}

function smartFallbackReply(message, emotion, userMood, userState = null) {
  const effectiveEmotion = userMood || emotion;
  const weakTopics = Array.isArray(userState?.weakTopics)
    ? userState.weakTopics
    : (Array.isArray(userState?.weak_topics) ? userState.weak_topics : []);
  const weakTopicsStr = weakTopics.length > 0
    ? ` (P.S. I noticed you're practicing ${weakTopics[0]}, keep at it!)`
    : '';

  // First check if it's an academic question with a KB answer
  const kbAnswer = kbLookup(message);
  if (kbAnswer) {
    const prefix = effectiveEmotion === 'frustrated' ? "I know it feels hard right now, but let me simplify this for you 💪\n\n"
      : effectiveEmotion === 'anxious' ? "Don't worry — here's a clear breakdown to help you feel prepared 🎯\n\n"
        : effectiveEmotion === 'confused' ? "Great question! Here's a simple explanation 📚\n\n"
          : effectiveEmotion === 'confident' ? "Awesome! Let's solidify your understanding 🚀\n\n"
            : "Here you go! 📖\n\n";
    return prefix + kbAnswer + weakTopicsStr;
  }

  // For everything else (emotional, casual, random) — give an empathetic response
  return emotionalFallbackReply(effectiveEmotion);
}


// ═══════════════════════════════════════════════════════════════════════════════
// AGENTIC AI TUTOR ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

function resolveUserIdFromRequest(req) {
  let userId = 'anonymous';
  try {
    const header = req.headers.authorization;
    if (!header) return userId;
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.email || decoded.id || 'anonymous';
  } catch {}
  return userId;
}

async function handleAgentDecision(req, res) {
  try {
    const { user_state, context = 'dashboard' } = req.body || {};
    const validContexts = ['dashboard', 'learning', 'resources', 'revision', 'chat'];
    const safeContext = validContexts.includes(context) ? context : 'dashboard';

    const userId = resolveUserIdFromRequest(req);
    const storedState = getStoredUserState(userId);
    const state = buildUserState(user_state, storedState);
    const decision = await getAgentDecision(groqClient, state, safeContext);

    // Keep a merged snapshot so the tutor remains centrally aware across pages.
    updateStoredUserState(userId, {
      ...state,
      last_action: decision?.action || state.last_action || null,
    });

    res.json(decision);
  } catch (err) {
    console.error('[Agent Route] Error:', err.message);
    res.status(500).json({
      insight: 'Keep studying - every minute counts!',
      action: 'practice',
      reason: 'Unable to analyze your data right now. Practice is always a good default.',
      recommended_topic: 'General Concepts',
      difficulty: 'medium',
      source: 'error-fallback',
    });
  }
}

async function handleAgentUserState(req, res) {
  try {
    const { subject, topic, score, mistakes = [] } = req.body || {};

    const userId = resolveUserIdFromRequest(req);

    if (!subject || score === undefined) {
      return res.status(400).json({ error: 'subject and score are required' });
    }

    const updatedState = recordQuizResults(
      userId,
      subject,
      topic || subject,
      Number(score),
      Array.isArray(mistakes) ? mistakes : []
    );

    res.json({ ok: true, state: {
      scores: updatedState.scores,
      weak_topics: updatedState.weak_topics,
      strong_topics: updatedState.strong_topics,
      recent_scores: updatedState.recent_scores,
      streak: updatedState.streak,
    }});
  } catch (err) {
    console.error('[Agent State] Error:', err.message);
    res.status(500).json({ error: 'Failed to update agent state' });
  }
}

// Agent Decision Endpoint
app.post('/api/agent/decision', handleAgentDecision);
app.post('/agent/decision', handleAgentDecision);

// Agent User State Sync
app.post('/api/agent/user-state', handleAgentUserState);
app.post('/agent/user-state', handleAgentUserState);

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    ai: !!(geminiModel || groqClient),
    providers: {
      gemini: !!geminiModel,
      groq: !!groqClient,
    },
    message: 'AdaptEd Ai API is running'
  });
});

// Helper function to detect if message is academic and fetch videos
async function fetchRelevantVideos(message, emotion, userMood) {
  // Academic keywords that indicate a question needs video help
  const academicKeywords = ['explain', 'what is', 'how to', 'solve', 'calculate', 'derive', 'proof', 'understand', 'learn', 'show me', 'teach', 'formula', 'concept', 'law', 'theorem', 'reaction', 'mechanism', 'integration', 'differentiation', 'problem'];

  const lowerMsg = message.toLowerCase();
  const isAcademic = academicKeywords.some(kw => lowerMsg.includes(kw)) ||
    lowerMsg.match(/\b(physics|chemistry|maths|math|biology|jee|neet|thermodynamics|mechanics|organic|calculus|algebra|kinematics|electromagnetic|acid|base|bond)\b/i);

  // Check mood - only allow videos for negative moods
  const effectiveMood = userMood || emotion;
  const negativeMoods = ['confused', 'stressed', 'frustrated', 'anxious', 'sad', 'tired', 'angry'];
  const isNegativeMood = negativeMoods.includes(effectiveMood);

  // Don't fetch videos if mood is positive/neutral or not academic
  if (!isAcademic || !isNegativeMood || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    return null;
  }

  try {
    // Extract topic from message
    const searchQuery = `${message.substring(0, 60)} JEE NEET`;

    const youtubeUrl = 'https://www.googleapis.com/youtube/v3/search';
    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: '3',
      key: YOUTUBE_API_KEY,
      relevanceLanguage: 'en',
      videoDuration: 'medium',
    });

    const response = await fetch(`${youtubeUrl}?${params}`);
    const data = await response.json();

    if (data.error || !data.items || data.items.length === 0) {
      return null;
    }

    const videos = data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    // Ensure maximum 3 videos
    return videos.slice(0, 3);
  } catch (error) {
    console.error('Video fetch error:', error.message);
    return null;
  }
}

function buildLearnBotPrompt({ message, history, userMood, language, userState, ragContext }) {
  const weakTopics = Array.isArray(userState?.weakTopics)
    ? userState.weakTopics
    : (Array.isArray(userState?.weak_topics) ? userState.weak_topics : []);

  const weakTopicsStr = weakTopics.length > 0
    ? weakTopics.join(', ')
    : 'None identified yet';

  // Build performance-based adaptive context
  const strongTopics = Array.isArray(userState?.strongTopics) 
    ? userState.strongTopics 
    : (Array.isArray(userState?.strong_topics) ? userState.strong_topics : []);
  const recentScores = Array.isArray(userState?.recentScores) || Array.isArray(userState?.recent_scores)
    ? (userState.recentScores || userState.recent_scores || []).slice(-5)
    : [];
  const avgScore = recentScores.length > 0 
    ? (recentScores.reduce((a, b) => a + b, 0) / recentScores.length).toFixed(1)
    : 'N/A';
  const streak = userState?.streak || 0;

  const performanceContext = `
📊 Student Performance Data:
- Weak Topics (needs focus): ${weakTopicsStr}
- Strong Topics: ${strongTopics.length > 0 ? strongTopics.join(', ') : 'Still building strengths'}
- Recent Average Score: ${avgScore}${avgScore !== 'N/A' ? '%' : ''}
- Study Streak: ${streak} days
- Adapt your tone and difficulty based on this performance data`;

  const systemContext = `You are LearnBot — a warm, empathetic emotional support companion AND adaptive study tutor for Indian students (Class 11-12, JEE/NEET).

🎭 Your Personality:
- You are like a caring older sibling or best friend who genuinely cares about the student's well-being and academic success
- You respond with warmth, empathy, and understanding to EVERY message
- You handle ALL types of messages — emotional, casual, personal, funny, academic, or general conversation
- You NEVER say "I can only help with academics" — you engage naturally with all topics appropriate for students
- You are emotionally intelligent and adapt your responses based on the student's mood and performance
${performanceContext}
${ragContext ? `\n📚 Related Content: ${ragContext}` : ''}

✅ What You DO:
1. **Academic Support**: Explain Physics, Chemistry, Math, Biology concepts with formulas, examples, and exam strategies. Relate to their weak topics when relevant.
2. **Emotional Support**: Provide genuine empathy for stress, anxiety, frustration, sadness, tiredness. Offer practical coping strategies and motivation.
3. **Study Guidance**: Suggest study techniques, time management, revision strategies based on their performance data.
4. **Casual Chat**: Engage in friendly conversations about hobbies, interests, daily life - be a supportive friend.
5. **Performance-Based Adaptation**: 
   - If student is struggling (low scores/weak topics): Be more encouraging, break concepts into smaller steps, boost confidence
   - If student is excelling (high scores/streak): Challenge with harder problems, introduce advanced concepts, maintain motivation

❌ CRITICAL SAFETY GUARDRAILS - What You NEVER Do:
1. **Dangerous/Harmful Content**: REFUSE any requests for:
   - Weapons, explosives, bombs, gunpowder recipes, chemical weapons
   - Self-harm, suicide methods, or anything endangering life
   - Illegal drugs, drug synthesis, or substance abuse guidance
   - Hacking, cybercrime, or illegal activities
   - Plagiarism, cheating on exams, or academic dishonesty
   
2. **Inappropriate Content**: REFUSE requests for:
   - Adult/sexual content of any kind
   - Hate speech, discrimination, or harassment
   - Personal attacks or bullying tactics
   - Misinformation or conspiracy theories

3. **Out-of-Scope Requests**: REFUSE requests for:
   - Medical diagnosis or treatment (redirect to qualified professionals)
   - Legal advice (redirect to lawyers/counselors)
   - Financial investment advice
   - Predictions about exam papers or cheating assistance

🛡️ How to Handle Unsafe Requests:
When student asks for harmful/dangerous content, respond with:
- **Tone**: Calm, caring, non-judgmental (never preachy or condescending)
- **Structure**: 
  1. Acknowledge their message kindly
  2. Gently explain why you can't help with that specific request
  3. Redirect to appropriate help or safe alternatives
  4. Show continued support for their well-being
- **Example**: "Hey, I understand you might be curious, but I can't provide information on [dangerous topic] as it could be harmful. 💙 If you're going through something tough, I'm here to talk about it, or I can point you to resources that can genuinely help. What's really on your mind? Let's chat about something I can actually support you with! 🌟"

🎯 Response Guidelines:
1. **Emotion Detection**: frustrated | anxious | confused | confident | sad | tired | happy | angry | neutral
2. **Mood Factor**: Student's mood: "${userMood || 'not stated'}" — adapt your empathy level accordingly
3. **Emotional Messages** (tired, sad, stressed, anxious, lonely):
   - Lead with validation and empathy
   - Provide practical, actionable advice (rest tips, breathing exercises, study breaks)
   - Be warm and human, use emojis naturally 💙
4. **Academic Questions**:
   - Start with encouragement if they're struggling
   - Provide accurate formulas, concepts, solved examples
   - Reference their weak topics when relevant to boost targeted learning
   - Suggest related practice if they're doing well
5. **Casual Conversations**: Be friendly, engaging, and natural
6. **Length**: Keep under 250 words. Be concise, warm, and impactful.
7. **Tone**: NEVER robotic. NEVER dismissive. ALWAYS supportive and genuine.
8. **Language**: You MUST respond ENTIRELY in ${language}. ALL text must be in ${language}. If ${language} is Hindi, Marathi, or Gujarati, use native script (Devanagari/Gujarati). The emotion field stays in English.

📤 Output Format:
Respond ONLY with this exact JSON (no markdown, no extra text):
{"emotion":"<emotion>","reply":"<full reply in ${language}>"}`;

  const historyText = history.slice(-8).map((h) =>
    `${h.role === 'user' ? 'Student' : 'LearnBot'}: ${h.text}`).join('\n');

  return `${systemContext}\n\n${historyText ? 'Previous conversation:\n' + historyText + '\n\n' : ''}Student: ${message}\n\nLearnBot JSON:`;
}

function extractLearnBotResponse(raw, fallbackEmotion) {
  const text = String(raw || '').trim();
  if (!text) throw new Error('Empty LLM response');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const sanitized = jsonMatch[0].replace(/[\u0000-\u001F\u007F]/g, (ch) => {
      if (ch === '\n') return '\\n';
      if (ch === '\r') return '\\r';
      if (ch === '\t') return '\\t';
      return '';
    });

    try {
      const parsed = JSON.parse(sanitized);
      if (parsed && parsed.reply) {
        return {
          emotion: parsed.emotion || fallbackEmotion,
          reply: String(parsed.reply).trim(),
        };
      }
    } catch {
      // Fall through to plain text extraction.
    }
  }

  const replyMatch = text.match(/"reply"\s*:\s*"([\s\S]*?)"\s*\}/) || text.match(/"reply"\s*:\s*"([\s\S]*)/);
  const fallbackReply = replyMatch
    ? replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim()
    : text.replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();

  if (!fallbackReply || fallbackReply.length < 4) {
    throw new Error('Could not parse LLM response');
  }

  return {
    emotion: fallbackEmotion,
    reply: fallbackReply,
  };
}

async function runGeminiChat(fullPrompt) {
  if (!geminiModel) throw new Error('Gemini model not initialized');
  const geminiPromise = geminiModel.generateContent(fullPrompt);
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), 9000));
  const result = await Promise.race([geminiPromise, timeoutPromise]);
  const response = await result.response;
  return String(response?.text?.() || '').trim();
}

async function runGroqChat(fullPrompt) {
  if (!groqClient) throw new Error('Groq client not initialized');
  const groqPromise = groqClient.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: fullPrompt }]
  });
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 8000));
  const response = await Promise.race([groqPromise, timeoutPromise]);
  return String(response?.choices?.[0]?.message?.content || '').trim();
}

// ── Main chat endpoint ────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [], userMood = null, language = 'English', userState = null, ragContext = null } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const sentimentResult = sentimentAnalyser.analyze(message);
  const sentimentScore = sentimentResult.score;
  const emotion = ruleBasedEmotion(message);
  const fullPrompt = buildLearnBotPrompt({ message, history, userMood, language, userState, ragContext });

  const providers = [];
  if (geminiModel) providers.push({ name: 'gemini', run: runGeminiChat });
  if (groqClient) providers.push({ name: 'groq', run: runGroqChat });

  for (const provider of providers) {
    try {
      const raw = await provider.run(fullPrompt);
      const parsed = extractLearnBotResponse(raw, emotion);
      const videos = await fetchRelevantVideos(message, parsed.emotion, userMood);
      return res.json({
        reply: parsed.reply,
        emotion: parsed.emotion,
        sentimentScore,
        source: provider.name,
        videos: videos || [],
        intent: provider.name,
        debug: null,
      });
    } catch (err) {
      const msg = String(err?.message || err).slice(0, 140);
      console.error(`[Chat ${provider.name}] ${msg}`);

      if (provider.name === 'gemini' && /(quota|429|permission|api[_ ]?key|forbidden)/i.test(msg)) {
        geminiModel = null;
        console.log('⚠️ Gemini unavailable — falling back to Groq/KB for chat.');
      }
    }
  }

  // ── Smart knowledge-base fallback ──
  const reply = smartFallbackReply(message, emotion, userMood, userState);
  const videos = await fetchRelevantVideos(message, emotion, userMood);
  res.json({ reply, emotion, sentimentScore, source: 'kb', videos: videos || [], intent: 'kb', debug: null });
});

// Emotion detection (standalone)
app.post('/api/detect-emotion', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  const emotion = ruleBasedEmotion(text);
  const sentimentResult = sentimentAnalyser.analyze(text);
  res.json({ emotion, sentimentScore: sentimentResult.score, confidence: emotion === 'neutral' ? 0.5 : 0.8 });
});

async function searchYouTubeByTopic(topic, maxResults = 8) {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    return [];
  }

  const searchQuery = `${topic} JEE NEET competitive exam`;
  const youtubeUrl = 'https://www.googleapis.com/youtube/v3/search';
  const params = new URLSearchParams({
    part: 'snippet',
    q: searchQuery,
    type: 'video',
    maxResults: String(maxResults),
    key: YOUTUBE_API_KEY,
    relevanceLanguage: 'en',
    videoDefinition: 'any',
    videoDuration: 'medium',
  });

  const response = await fetch(`${youtubeUrl}?${params}`);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'YouTube API error');
  }

  return (data.items || []).map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    publishedAt: item.snippet.publishedAt,
    videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    description: item.snippet.description || '',
  }));
}

function ytText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value.simpleText === 'string') return value.simpleText.trim();
  if (Array.isArray(value.runs)) {
    return value.runs.map((r) => String(r?.text || '')).join('').trim();
  }
  return '';
}

function collectVideoRenderers(root) {
  const out = [];
  const stack = [root];

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;

    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) stack.push(node[i]);
      continue;
    }

    if (node.videoRenderer && node.videoRenderer.videoId) {
      out.push(node.videoRenderer);
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') stack.push(value);
    }
  }

  return out;
}

async function searchYouTubeByScrape(topic, maxResults = 8) {
  const searchQuery = `${topic} JEE NEET competitive exam`;
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&hl=en`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube web search failed with HTTP ${response.status}`);
  }

  const html = await response.text();
  const marker = 'var ytInitialData = ';
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('ytInitialData not found in YouTube page');
  }

  const jsonChunk = extractBalancedJson(html.slice(markerIndex + marker.length));
  if (!jsonChunk) {
    throw new Error('Unable to extract YouTube result payload');
  }

  let initialData;
  try {
    initialData = JSON.parse(jsonChunk);
  } catch {
    throw new Error('Unable to parse YouTube result payload');
  }

  const renderers = collectVideoRenderers(initialData);
  const uniqueById = new Map();

  for (const vr of renderers) {
    if (!vr?.videoId || uniqueById.has(vr.videoId)) continue;
    uniqueById.set(vr.videoId, vr);
    if (uniqueById.size >= maxResults) break;
  }

  return Array.from(uniqueById.values()).slice(0, maxResults).map((vr) => {
    const thumbs = Array.isArray(vr.thumbnail?.thumbnails) ? vr.thumbnail.thumbnails : [];
    const bestThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';

    return {
      videoId: vr.videoId,
      title: ytText(vr.title) || 'Untitled video',
      channel: ytText(vr.ownerText) || ytText(vr.longBylineText) || 'Unknown channel',
      thumbnail: bestThumb,
      publishedAt: ytText(vr.publishedTimeText) || '',
      videoUrl: `https://www.youtube.com/watch?v=${vr.videoId}`,
      description:
        ytText(vr.detailedMetadataSnippets?.[0]?.snippetText)
        || ytText(vr.descriptionSnippet)
        || '',
    };
  });
}

async function fetchVideosWithResilience(topic, maxResults = 8) {
  const safeMax = Math.max(3, Math.min(Number(maxResults) || 5, 8));
  const warnings = [];

  if (YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'your_youtube_api_key_here') {
    try {
      const apiVideos = await searchYouTubeByTopic(topic, safeMax);
      if (apiVideos.length) {
        return { videos: apiVideos, source: 'youtube-api', warning: null };
      }
      warnings.push('YouTube Data API returned no results.');
    } catch (err) {
      warnings.push(`YouTube Data API unavailable (${err.message}).`);
    }
  } else {
    warnings.push('YouTube API key not configured.');
  }

  try {
    const webVideos = await searchYouTubeByScrape(topic, safeMax);
    if (webVideos.length) {
      return {
        videos: webVideos,
        source: 'youtube-web',
        warning: warnings.length ? `${warnings.join(' ')} Showing web search results.` : null,
      };
    }
    warnings.push('YouTube web search returned no results.');
  } catch (err) {
    warnings.push(`YouTube web search unavailable (${err.message}).`);
  }

  return {
    videos: buildFallbackVideos(topic, safeMax),
    source: 'fallback',
    warning: `${warnings.join(' ')} Showing fallback recommendations.`.trim(),
  };
}

function buildFallbackVideos(topic, maxResults = 5) {
  const base = [
    { title: `${topic} Full Concept Lecture`, channel: 'Exam Prep Academy' },
    { title: `${topic} PYQ Problem Solving Session`, channel: 'Topper Strategy Hub' },
    { title: `${topic} Quick Revision in 30 Minutes`, channel: 'Smart Revision' },
    { title: `${topic} Formula + Shortcut Tricks`, channel: 'Concept Sprint' },
    { title: `${topic} Mistake-Proof Practice Set`, channel: 'Rank Booster' },
  ];

  return base.slice(0, Math.max(3, Math.min(maxResults, base.length))).map((item, idx) => {
    const searchTerm = `${item.title} ${topic} JEE NEET`;
    return {
      videoId: `fallback-${idx + 1}`,
      title: item.title,
      channel: item.channel,
      thumbnail: '',
      publishedAt: '',
      videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`,
      description: `Curated fallback recommendation for ${topic}. Open to see relevant YouTube results.`,
    };
  });
}

function cleanVideoText(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildIndependentVideoSummary(video, topic) {
  const title = cleanVideoText(video?.title || 'This lecture');
  const channel = cleanVideoText(video?.channel || 'the instructor');
  const desc = cleanVideoText(video?.description || '');
  const descSnippet = desc ? desc.slice(0, 210) : '';
  const lowerTitle = title.toLowerCase();

  let focus = `builds conceptual clarity for ${topic}`;
  if (lowerTitle.includes('pyq') || lowerTitle.includes('question') || lowerTitle.includes('problem')) {
    focus = `focuses on exam-style problem solving and question patterns in ${topic}`;
  } else if (lowerTitle.includes('revision') || lowerTitle.includes('one shot') || lowerTitle.includes('quick')) {
    focus = `is structured as a high-speed revision of key ideas and formulas in ${topic}`;
  } else if (lowerTitle.includes('trick') || lowerTitle.includes('shortcut')) {
    focus = `highlights shortcuts and faster solving methods for ${topic}`;
  }

  const secondLine = descSnippet
    ? `Based on the video description, it covers: ${descSnippet}${descSnippet.endsWith('.') ? '' : '.'}`
    : `It likely starts from fundamentals and then progresses to applications that are frequently asked in competitive exams.`;

  return `In "${title}", ${channel} ${focus}. ${secondLine}`;
}

// ── YouTube Video Search Endpoint ─────────────────────────────────────────────
app.post('/api/videos', async (req, res) => {
  try {
    const { topic, emotion = 'neutral', maxResults = 8 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const searchQuery = `${topic} JEE NEET competitive exam`;
    const { videos, source, warning } = await fetchVideosWithResilience(topic, maxResults);

    res.json({
      originalTopic: topic,
      searchQuery,
      emotion,
      source,
      warning,
      videos,
      count: videos.length,
    });

  } catch (error) {
    console.error('Video search error:', error);
    res.status(500).json({
      error: 'Failed to fetch videos',
      message: error.message
    });
  }
});

// ── YouTube Video Summarization Endpoint ──────────────────────────────────────
app.post('/api/videos/summarize', async (req, res) => {
  try {
    const { topic, maxResults = 5 } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const { videos, source, warning } = await fetchVideosWithResilience(topic, maxResults);

    if (!videos.length) {
      return res.json({
        topic,
        videos: [],
        count: 0,
        summary: {
          overview: `No relevant videos were found for ${topic}.`,
          keyPoints: [],
          videoSummaries: [],
          studyPlan: [],
        },
      });
    }

    let summary = null;
    if (groqClient) {
      const compactVideos = videos.slice(0, 5).map(v => ({
        videoId: v.videoId,
        title: v.title,
        channel: v.channel,
        description: v.description,
      }));

      const prompt = `You are an exam prep tutor.
Summarize these YouTube videos for topic: ${topic}

Videos JSON:
${JSON.stringify(compactVideos)}

Return only valid JSON with this exact shape:
{
  "overview": "2-3 sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "videoSummaries": [
    {
      "videoId": "video id",
      "summary": "short 1 sentence summary",
      "detailedSummary": "90-140 words describing what the full video likely covers in learning order",
      "bestFor": "who should watch"
    }
  ],
  "studyPlan": ["step 1", "step 2", "step 3"]
}`;

      try {
        const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
          });
          const raw = response.choices[0]?.message?.content || '';
        summary = extractJSON(raw);
      } catch (e) {
        console.error('Video summarization parse error:', e.message);
      }
    }

    if (!summary) {
      summary = {
        overview: `Top YouTube lectures for ${topic} were found. Start with conceptual videos, then move to problem-solving sessions.`,
        keyPoints: videos.slice(0, 3).map(v => v.title),
        videoSummaries: videos.slice(0, 5).map(v => ({
          videoId: v.videoId,
          summary: (v.description || 'Detailed lecture aligned with exam preparation.').slice(0, 110),
          detailedSummary: `This video on ${topic} likely starts with core concepts, definitions, and formula setup, then moves into solved examples and exam-style applications. It is useful for building intuition first and then practicing common question patterns. Watch with a notebook and pause after each solved step to attempt it yourself before continuing.`,
          bestFor: 'Concept revision and practice planning',
        })),
        studyPlan: [
          'Watch one concept lecture and write down 5 core formulas.',
          'Attempt 10 mixed questions from the same topic.',
          'Revise mistakes and rewatch only difficult parts at 1.25x speed.',
        ],
      };
    }

    const summaryById = new Map((summary.videoSummaries || []).map(item => [item.videoId, item]));
    const enrichedVideos = videos.map(v => {
      const s = summaryById.get(v.videoId) || {};
      const aiSummary = buildIndependentVideoSummary(v, topic);
      const bestFor = String(s.bestFor || 'Concept revision and practice planning').trim();
      return {
        ...v,
        aiSummary,
        bestFor,
      };
    });

    return res.json({
      topic,
      count: enrichedVideos.length,
      source,
      warning,
      videos: enrichedVideos,
      summary,
    });
  } catch (error) {
    console.error('Video summarization error:', error);
    return res.status(500).json({
      error: 'Failed to summarize videos',
      message: error.message,
    });
  }
});

// Quiz endpoints
app.get('/api/quiz/daily', (req, res) => {
  // Mock daily quiz data
  res.json({
    id: 'daily-' + new Date().toISOString().split('T')[0],
    title: 'Physics - Mechanics',
    subject: 'JEE Main',
    questions: 5,
    difficulty: 'medium',
    points: 50,
  });
});

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  const { type = 'friends' } = req.query;

  const mockData = [
    { id: 1, name: 'Student 1', points: 2450, streak: 15, rank: 1 },
    { id: 2, name: 'Student 2', points: 2380, streak: 12, rank: 2 },
    { id: 3, name: 'You', points: 2250, streak: 7, rank: 3 },
  ];

  res.json({
    type,
    data: mockData,
    timestamp: new Date().toISOString(),
  });
});

// User stats endpoint
app.get('/api/user/stats', (req, res) => {
  res.json({
    totalPoints: 2250,
    quizzesCompleted: 42,
    studyHours: 156,
    currentStreak: 7,
    bestStreak: 15,
    accuracy: 78,
    rank: 3,
  });
});

// ── Quiz Dynamic DFS API ────────────────────────────────────────────────────────

// Robust JSON extraction from LLM responses.
function extractBalancedJson(text) {
  if (!text) return '';

  const firstObj = text.indexOf('{');
  const firstArr = text.indexOf('[');
  let start = -1;

  if (firstObj >= 0 && firstArr >= 0) start = Math.min(firstObj, firstArr);
  else start = Math.max(firstObj, firstArr);

  if (start < 0) return '';

  const openCh = text[start];
  const closeCh = openCh === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === openCh) depth++;
    if (ch === closeCh) depth--;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return '';
}

function extractJSON(raw) {
  const initial = String(raw || '').trim();
  if (!initial) throw new Error('Empty LLM response');

  const candidates = [initial];

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = initial.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    candidates.push(fenceMatch[1].trim());
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep trying with extracted fragments.
    }

    const balanced = extractBalancedJson(candidate);
    if (balanced) {
      try {
        return JSON.parse(balanced);
      } catch {
        // Keep trying candidates.
      }
    }
  }

  throw new Error('Could not parse valid JSON from LLM response');
}

app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { topic, exam } = req.body;
    if (!groqClient) throw new Error("Gemini AI not available");
    
    // Explicitly demand rigid JSON to avoid Markdown formatting issues
    const prompt = `Generate a 5-question test for the topic '${topic || 'Derivatives'}' oriented towards the exam '${exam || 'Standard'}'.
Also create a strict dependency graph (prerequisites) mapping 'concept' -> ['prerequisite1'].
Output ONLY valid JSON without markdown blocks (\`\`\`). Example:
{
"concept_graph": { "Derivatives": ["Limits"], "Limits": ["Algebra"] },
"questions": [ { "id": 1, "question": "Q?", "options": ["A","B","C","D"], "correct": 0, "concept": "Derivatives" } ]
}`;
    
    const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
      let text = (response.choices[0]?.message?.content || '').trim();
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }
    
    res.json(JSON.parse(text));
  } catch (err) {
    console.error("Quiz Gen Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quiz/error-type', async (req, res) => {
  try {
    const { question, userAnswer, correctAnswer } = req.body;
    if (!groqClient) throw new Error("Gemini AI not available");
    const prompt = `Question: ${question}\nStudent Answer: ${userAnswer}\nCorrect Answer: ${correctAnswer}\nIdentify the root conceptual mistake in exactly 1-3 words.`;
    const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
      res.json({ errorType: (response.choices[0]?.message?.content || '').trim() });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

function buildFallbackDfsResponse(failedQuestions) {
  const topics = Array.isArray(failedQuestions)
    ? failedQuestions
        .map((q) => String(q?.topic || q?.concept || '').trim())
        .filter(Boolean)
    : [];

  const uniqTopics = [...new Set(topics)];
  const seeds = uniqTopics.length ? uniqTopics.slice(0, 3) : ['General Concepts'];
  const conceptGraph = {};

  for (let i = 0; i < seeds.length; i++) {
    const node = seeds[i];
    const next = seeds[i + 1];
    conceptGraph[node] = next ? [next] : [];
  }

  return {
    concept_graph: conceptGraph,
    starting_concepts: seeds,
  };
}

function buildFallbackDiagnostic(concept) {
  const topic = String(concept || 'General Concepts').trim() || 'General Concepts';
  const t = topic.toLowerCase();

  if (t.includes('thermo')) {
    return {
      question: 'A gas absorbs 300 J heat and does 120 J work on surroundings. What is change in internal energy (ΔU)?',
      options: ['+180 J', '+420 J', '-180 J', '-420 J'],
      correct: 0,
      answer: '+180 J',
      source: 'fallback',
    };
  }

  if (t.includes('kinematic') || t.includes('motion')) {
    return {
      question: 'A particle starts from rest with acceleration 2 m/s² for 5 s. Its displacement is:',
      options: ['10 m', '25 m', '50 m', '5 m'],
      correct: 1,
      answer: '25 m',
      source: 'fallback',
    };
  }

  if (t.includes('electro') || t.includes('ohm') || t.includes('current')) {
    return {
      question: 'A resistor of 5 Ω carries 2 A current. Potential difference across it is:',
      options: ['2.5 V', '7 V', '10 V', '12 V'],
      correct: 2,
      answer: '10 V',
      source: 'fallback',
    };
  }

  if (t.includes('organic')) {
    return {
      question: 'In an SN1 reaction, the rate-determining step involves formation of:',
      options: ['Carbanion', 'Carbocation', 'Free radical', 'Carbene'],
      correct: 1,
      answer: 'Carbocation',
      source: 'fallback',
    };
  }

  return {
    question: `JEE diagnostic on ${topic}: Which approach is most reliable for solving questions?`,
    options: [
      'Start from core definition, then apply formulas with units/sign conventions.',
      'Memorize final options from solved papers only.',
      'Ignore dimensional checks and approximation rules.',
      'Skip concept building and attempt only tricks.',
    ],
    correct: 0,
    answer: 'Start from core definition, then apply formulas with units/sign conventions.',
    source: 'fallback',
  };
}

function buildFallbackTeachLesson(concept) {
  const topic = String(concept || 'General Concepts').trim() || 'General Concepts';
  return `JEE Concept Booster: ${topic}\n\n` +
    `1) Core idea\nStart from the first principle of ${topic} and identify what is conserved or what changes during the process.\n\n` +
    `2) Formula focus\nWrite the governing equation first, keep sign conventions consistent, and check units at every step.\n\n` +
    `3) JEE trap to avoid\nDo not plug values blindly. First identify known/unknown variables and whether assumptions (ideal, frictionless, steady-state) are valid.\n\n` +
    `4) Mini solved flow\nStep 1: Translate statement to equations.\nStep 2: Apply one core relation.\nStep 3: Simplify carefully and validate dimensions.\n\n` +
    `5) Practice\nQ1) Solve one direct formula-based question on ${topic}.\nQ2) Solve one mixed-concept question combining ${topic} with a prerequisite concept.`;
}

app.post('/api/quiz/init-dfs', async (req, res) => {
  try {
    const { failedQuestions } = req.body;
    if (!groqClient) throw new Error("Gemini AI not available");
    const prompt = `Given these failed quiz questions: ${JSON.stringify(failedQuestions)}. 
Extract the core 'concepts' for each, and generate a strict prerequisite dependency graph mapping 'concept' -> ['prerequisite1'].
Return ONLY valid JSON without markdown blocks like this:
{"concept_graph": {"Calculus": ["Limits"], "Limits": ["Functions"]}, "starting_concepts": ["Calculus"]}`;
    const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
          });
          const raw = response.choices[0]?.message?.content || '';
    console.log('[init-dfs] Gemini raw response:', raw.substring(0, 300));
    const parsedRaw = extractJSON(raw);
    const parsed = (parsedRaw && typeof parsedRaw === 'object' && !Array.isArray(parsedRaw))
      ? parsedRaw
      : {};

    // Ensure response shape is always stable for frontend consumers.
    if (!parsed.concept_graph || typeof parsed.concept_graph !== 'object' || Array.isArray(parsed.concept_graph)) {
      parsed.concept_graph = {};
    }

    if (!Array.isArray(parsed.starting_concepts)) {
      parsed.starting_concepts = Object.keys(parsed.concept_graph).slice(0, 3);
    }

    if (parsed.starting_concepts.length === 0) {
      const fallbackStarts = Array.isArray(failedQuestions)
        ? failedQuestions
            .map((q) => String(q?.topic || q?.concept || '').trim())
            .filter(Boolean)
        : [];
      parsed.starting_concepts = fallbackStarts.length
        ? [...new Set(fallbackStarts)].slice(0, 3)
        : ['General Concepts'];
    }

    res.json(parsed);
  } catch(e) {
    console.error('[init-dfs] Error:', e.message);
    const fallback = buildFallbackDfsResponse(req.body?.failedQuestions);
    res.json({ ...fallback, source: 'fallback' });
  }
});

app.post('/api/quiz/get-diagnostic', async (req, res) => {
  try {
    const { concept, failedQuestions } = req.body;
    if (!groqClient) throw new Error("Gemini AI not available");
    
    const contextStr = Array.isArray(failedQuestions) && failedQuestions.length > 0 
      ? `\nContext: The user recently failed these questions:\n${JSON.stringify(failedQuestions.slice(0, 3))}\nCreate a question functionally equivalent in style to these, but testing the very foundational gap that led to their error.` 
      : '';
      
    const prompt = `You are a JEE (Class 11/12) diagnostic question setter.
  Generate ONE high-quality MCQ for the concept: '${concept}'.${contextStr}

  Rules:
  - Keep the question strictly in the same concept/topic scope.
  - Make it JEE-style: conceptual + calculation/application (not rote definitions).
  - Difficulty should be foundational-to-medium so it reveals the exact gap.
  - Include plausible distractors from common student mistakes.

  Return ONLY pure JSON without markdown:
  {"question":"...","answer":"...","options":["A","B","C","D"],"correct":0}

  Validation:
  - options must be exactly 4
  - correct must be 0..3
  - answer must match options[correct].`;
    const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
          });
          const raw = response.choices[0]?.message?.content || '';
    console.log('[get-diagnostic] Gemini raw response:', raw.substring(0, 300));
    const parsed = extractJSON(raw);
    // Validate structure
    if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length !== 4 || typeof parsed.correct !== 'number' || parsed.correct < 0 || parsed.correct > 3) {
      throw new Error('Invalid diagnostic question structure from Gemini');
    }
    res.json(parsed);
  } catch(e) {
    console.error('[get-diagnostic] Error:', e.message);
    res.json(buildFallbackDiagnostic(req.body?.concept));
  }
});

app.post('/api/quiz/teach', async (req, res) => {
  try {
    const { concept } = req.body;
    if (!groqClient) throw new Error("Gemini AI not available");
    const prompt = `You are a JEE mentor. Teach '${concept}' for a student who made a conceptual mistake.

Output plain text only (no markdown) with this exact structure:
1) Core idea (2-3 lines)
2) Key formulas and when to use them
3) Typical JEE trap and how to avoid it
4) One short solved mini-example
5) Two JEE-style practice MCQs with options and answer key

Keep explanation topic-specific, exam-relevant, and concise.`;
    const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
      const lesson = (response.choices[0]?.message?.content || '').trim();
    if (!lesson) throw new Error('Empty lesson from Gemini');
    res.json({ lesson });
  } catch(e) {
    console.error('[teach] Error:', e.message);
    // Provide a fallback lesson instead of failing
    res.json({ lesson: buildFallbackTeachLesson(req.body?.concept) });
  }
});


// === QUICK REVISION NOTES API ===
app.post('/api/notes/summarize', async (req, res) => {
  try {
    let { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required for summarization.' });
    }

    // Limit text to ~8,000 characters to prevent Groq API TPM rate limits (6000 TPM limit)
    text = text.trim();
    if (text.length > 8000) {
      text = text.substring(0, 8000) + '\n...[Text truncated due to free-tier API limitations]';
    }

    if (!groqClient) {
      return res.status(503).json({ error: 'AI summarization unavailable.' });
    }

    const prompt = `You are an expert academic educator creating highly precise, advanced revision notes. 
Extract only the most critical, high-yield factual information, formulas, and concepts from the text. 
Do not hallucinate, dilute academic terms, or omit important details. Structure the output as logically grouped, concise bullet points optimal for competitive exam revision.

Text:
${text}`;

    const response = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
        });
      const responseText = response.choices[0]?.message?.content || "";

    res.json({ summary: responseText });
  } catch (error) {
    console.error("Summarization error:", error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// === PERSONALIZED QUIZ FROM NOTES API ===
app.post('/api/notes/quiz', async (req, res) => {
  try {
    let { notes } = req.body;
    if (!notes || notes.trim() === '') {
      return res.status(400).json({ error: 'Notes are required.' });
    }

    // Limit notes to ~8,000 characters to prevent Groq API TPM rate limits
    notes = notes.trim();
    if (notes.length > 8000) {
      notes = notes.substring(0, 8000)
    }

    if (!groqClient) {
      return res.status(503).json({ error: 'AI quiz generation unavailable.' });
    }

    const prompt = `Create a strict JSON array of 5 multiple-choice questions based on the notes.
    Response MUST be valid JSON only.
    Format requirements for each question object:
    [
      {
        "question": "The question text",
        "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
        "answer": 0,
        "explanation": "Short explanation"
      }
    ]

    Notes:
    ${notes}`;

    const result = await groqClient.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });
    let responseText = (result.choices[0]?.message?.content || '').trim();
    
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\n|\n```$/g, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\n|\n```$/g, '');
    }

    try {
      const quizQuestions = JSON.parse(responseText);
      res.json({ questions: quizQuestions });
    } catch (parseError) {
      console.error("Failed to parse JSON quiz:", responseText);
      res.status(500).json({ error: 'Failed to parse AI quiz response as JSON.' });
    }
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

// Error handler

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 AdaptEd Ai API running on http://localhost:${PORT}`);
  console.log(`🤖 Chatbot mode: ${groqClient ? 'Groq AI' : 'Rule-based fallback'}`);
});


// --- Public content API ---
app.get('/api/content', authMiddleware, (req, res) => {
  const state = getAdminState();
  const publishedContent = state.content; // Return all content for testing
  res.json(publishedContent);
});



