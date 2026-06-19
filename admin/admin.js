const DB_KEY = "admin-local-db-v1";
const APP_STATE_KEY = "admin-app-state-v1";
const ADMIN_LOGIN_ROLE = "ls-login-role";
const ORIGIN = window.location.origin;
const API_BASE = window.API || ((ORIGIN && ORIGIN !== "null") ? ORIGIN : "http://localhost:5050");
const LAST_BULK_PREVIEW_KEY = "admin-last-bulk-preview";

const navItems = [
  ["overview", "admin/index.html", "Dashboard"],
  ["content", "admin/content.html", "Content CMS"],
  ["quizzes", "admin/quizzes.html", "Quiz Studio"],
  ["users", "admin/users.html", "User Management"],
  ["categories", "admin/categories.html", "Subjects"],
  ["feedback", "admin/feedback.html", "Feedback"],
  ["notifications", "admin/notifications.html", "Announcements"],
  ["insights", "admin/insights.html", "Insights"],
  ["backup", "admin/backup.html", "Backup"],
];

const navIcons = {
  overview: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
  content: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h6"/></svg>`,
  quizzes: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M8 14h3M13 14h3"/></svg>`,
  users: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.5"/><path d="M14.5 19a4.5 4.5 0 0 1 7 0"/></svg>`,
  categories: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="7" height="6" rx="1.2"/><rect x="14" y="4" width="7" height="6" rx="1.2"/><rect x="8.5" y="14" width="7" height="6" rx="1.2"/><path d="M10 7h4M12 10v4"/></svg>`,
  feedback: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H8l-4 4z"/><path d="M8 9h8M8 12h5"/></svg>`,
  notifications: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a5 5 0 0 0-5 5v3l-2 3h14l-2-3V9a5 5 0 0 0-5-5"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>`,
  insights: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"/><rect x="6" y="12" width="3" height="5" rx="0.6"/><rect x="11" y="9" width="3" height="8" rx="0.6"/><rect x="16" y="6" width="3" height="11" rx="0.6"/></svg>`,
  backup: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v10H4z"/><path d="M8 8V5h8v3"/><path d="M9 13h6M12 10v6"/></svg>`,
};

function setupNavAutoHide() {
  const nav = qs("adminNav");
  if (!nav) return;

  let navTimeout = null;
  const hideNav = () => nav.classList.add("nav-hidden");
  const showNav = () => {
    nav.classList.remove("nav-hidden");
    if (navTimeout) clearTimeout(navTimeout);
    navTimeout = setTimeout(hideNav, 3500);
  };

  ["mousemove", "touchstart", "scroll", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, showNav, { passive: true });
  });

  nav.addEventListener("mouseenter", showNav);
  showNav();
}

function readUser() {
  try {
    const fromLs = localStorage.getItem("ls-user");
    if (fromLs) return JSON.parse(fromLs);
  } catch (_) {}
  const name = localStorage.getItem("user_name") || "Admin User";
  const email = localStorage.getItem("user_email") || "admin@adapted.local";
  return { name, email };
}

function detectSuperAdmin(email) {
  if (!email) return false;
  const list = ["superadmin@adapted.ai", "owner@adapted.ai"];
  return list.includes(email.toLowerCase());
}

function getToken() {
  return localStorage.getItem("ls-token") || localStorage.getItem("token");
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = await res.json();
      message = body.error || message;
    } catch (_) {}
    throw new Error(message);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

async function ensureAdminAccess() {
  try {
    const me = await apiRequest("/api/auth/me", { method: "GET" });
    if (me.role !== "Admin" || me.banned) {
      localStorage.removeItem(ADMIN_LOGIN_ROLE);
      window.location.href = "../login.html";
      return false;
    }
    localStorage.setItem(ADMIN_LOGIN_ROLE, "admin");
    localStorage.setItem("ls-user", JSON.stringify(me));
    return true;
  } catch (err) {
    const msg = (err.message || "").toLowerCase();
    if (msg.includes("token") || msg.includes("unauthorized") || msg.includes("login")) {
      window.location.href = "../login.html";
      return false;
    }
    console.warn("Network offline during ensureAdminAccess, trusting existing token:", err);
    // Do not log out if it's just a temporary network error.
    return !!getToken();
  }
}

function seedData() {
  const db = {
    users: [
      { id: "u1", name: "Riya Nair", email: "riya@student.adapted.ai", role: "Student", banned: false, uploads: 5, summaries: 7, lastSeen: "2m ago" },
      { id: "u2", name: "Arjun Mehta", email: "arjun@student.adapted.ai", role: "Student", banned: false, uploads: 2, summaries: 1, lastSeen: "11m ago" },
      { id: "u3", name: "Asha Sharma", email: "asha@teacher.adapted.ai", role: "Teacher", banned: false, uploads: 14, summaries: 21, lastSeen: "online" },
      { id: "u4", name: "System Admin", email: "superadmin@adapted.ai", role: "Admin", banned: false, uploads: 0, summaries: 0, lastSeen: "online" }
    ],
    content: [
      { id: "c1", title: "Electrostatics Basics", subject: "Physics", chapter: "Electrostatics", difficulty: "Medium", format: "PDF", version: 3, status: "Published" },
      { id: "c2", title: "Chemical Bonding Notes", subject: "Chemistry", chapter: "Bonding", difficulty: "Easy", format: "DOCX", version: 2, status: "Draft" },
      { id: "c3", title: "Integration Tricks", subject: "Math", chapter: "Calculus", difficulty: "Hard", format: "TXT", version: 1, status: "Published" }
    ],
    summaries: [
      { id: "s1", title: "Electrostatics Quick Summary", contentId: "c1", quality: 89, approved: true, downloads: 67, feedbackAvg: 4.4 },
      { id: "s2", title: "Bonding Snapshot", contentId: "c2", quality: 61, approved: false, downloads: 15, feedbackAvg: 3.1 },
      { id: "s3", title: "Integration Revision", contentId: "c3", quality: 48, approved: false, downloads: 7, feedbackAvg: 2.6 }
    ],
    aiQueue: [
      { id: "q1", task: "Summarize c2", type: "Medium", status: "queued", retries: 0 },
      { id: "q2", task: "Keyword extraction c3", type: "Detailed", status: "failed", retries: 1 }
    ],
    aiLogs: [
      { at: "10:22", item: "c1", output: "Strong conceptual clarity" },
      { at: "10:38", item: "c2", output: "Needs chapter examples" }
    ],
    categories: [
      { id: "cat1", name: "Physics", chapter: "Mechanics", subtopic: "Kinematics" },
      { id: "cat2", name: "Chemistry", chapter: "Organic", subtopic: "Hydrocarbons" },
      { id: "cat3", name: "Math", chapter: "Algebra", subtopic: "Quadratic" }
    ],
    feedback: [
      { id: "f1", summaryId: "s1", rating: 5, comment: "Very crisp and exam helpful" },
      { id: "f2", summaryId: "s2", rating: 2, comment: "Too generic" },
      { id: "f3", summaryId: "s3", rating: 3, comment: "Need more solved examples" }
    ],
    searchQueries: ["electrostatics formula sheet", "integration by parts shortcut", "neet cell cycle notes"],
    boosts: { formula: 0.8, exam: 0.6, revision: 0.75 },
    notifications: [
      { id: "n1", title: "New Physics Pack", body: "Mechanics pack published", audience: "all", at: "today" }
    ],
    audit: [
      { at: "09:12", actor: "System Admin", action: "Changed role for Riya Nair" },
      { at: "09:48", actor: "System Admin", action: "Approved summary s1" }
    ],
    metrics: {
      activity: { daily: [22, 31, 17, 40, 36, 46, 28], weekly: [184, 210, 198, 243], monthly: [730, 870, 910, 1020] },
      apiUsage: [120, 130, 142, 156, 171, 165, 180],
      errorRate: [4.1, 3.8, 2.9, 3.1, 2.1, 2.4, 1.9],
      responseTime: [760, 700, 640, 620, 590, 610, 560],
      peakHours: [["8 AM", 20], ["12 PM", 56], ["6 PM", 81], ["9 PM", 63]],
      strugglingSubjects: [["Organic Chemistry", 74], ["Electromagnetics", 62], ["Differential Equations", 58]],
      summarizedChapters: [["Electrostatics", 121], ["Chemical Bonding", 98], ["Matrices", 77]]
    },
    backup: { lastBackup: "Never", storageUsedMb: 512, storageLimitMb: 2048 }
  };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getDb() {
  return JSON.parse(localStorage.getItem(DB_KEY) || "{}");
}

function setDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return apiRequest("/api/admin/state", {
    method: "PUT",
    body: JSON.stringify(db),
  }).catch(() => ({}));
}

async function setDbStrict(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return apiRequest("/api/admin/state", {
    method: "PUT",
    body: JSON.stringify(db),
  });
}

function saveAndReload(db) {
  setDb(db).finally(() => {
    location.reload();
  });
}

async function refreshDbFromApi() {
  try {
    const db = await apiRequest("/api/admin/state", { method: "GET" });
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  } catch (_) {
    seedData();
    return getDb();
  }
}

async function requestBulkPreview(items, level = "medium") {
  const data = await apiRequest("/api/admin/preview-summaries", {
    method: "POST",
    body: JSON.stringify({ items, level }),
  });
  return data.previews || [];
}

async function requestBulkPreviewFromFiles(files, items, level = "medium") {
  const token = getToken();
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  form.append("level", level);
  form.append("meta", JSON.stringify(items));

  const res = await fetch(`${API_BASE}/api/admin/preview-upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let message = "Preview generation failed";
    try {
      const body = await res.json();
      message = body.error || message;
    } catch (_) {}
    throw new Error(message);
  }

  const data = await res.json();
  return data.previews || [];
}

async function sendAnnouncement(notice) {
  try {
    return await apiRequest("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify(notice),
    });
  } catch (_) {
    // Backward-compatibility fallback when server route is unavailable.
    const db = await refreshDbFromApi();
    const fallbackNotice = {
      id: "n" + Date.now(),
      title: notice.title,
      body: notice.body,
      audience: notice.audience || "all",
      at: new Date().toLocaleDateString(),
    };
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.unshift(fallbackNotice);
    await setDbStrict(db);
    return { ok: true, notice: fallbackNotice, notifications: db.notifications };
  }
}

function qs(id) {
  return document.getElementById(id);
}

function drawLineChart(canvasId, values, color) {
  const c = qs(canvasId);
  if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.width = c.clientWidth * 2;
  const h = c.height = c.clientHeight * 2;
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const gap = w / Math.max(values.length - 1, 1);

  ctx.lineWidth = 2;
  ctx.strokeStyle = color || "#ef6c00";
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = i * gap;
    const y = h - ((v - min) / (max - min || 1)) * (h - 30) - 15;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "rgba(239,108,0,0.08)";
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}

function setNav(active) {
  const nav = qs("adminNav");
  if (!nav) return;
  nav.innerHTML = navItems.map(([key, href, label]) => {
    const cls = key === active ? "nav-link active" : "nav-link";
    const icon = navIcons[key] || navIcons.overview;
    return `<a class="${cls}" href="../${href}" title="${label}" aria-label="${label}"><span class="nav-icon">${icon}</span><span>${label}</span></a>`;
  }).join("");
}

function setHeader(moduleKey) {
  const map = Object.fromEntries(navItems.map(([k, , t]) => [k, t]));
  qs("pageTitle").textContent = map[moduleKey] || "Admin";
  const user = readUser();
  qs("adminIdentity").textContent = `${user.name} (${detectSuperAdmin(user.email) ? "Super Admin" : "Admin"})`;
}

function wireCommonActions() {
  const logout = qs("logoutBtn");
  if (logout) {
    logout.addEventListener("click", () => {
      // Clear all auth/session/localStorage keys
      localStorage.removeItem("ls-token");
      localStorage.removeItem("token");
      localStorage.removeItem("ls-user");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      localStorage.removeItem(ADMIN_LOGIN_ROLE);
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem(APP_STATE_KEY);
      sessionStorage.clear();
      // Prevent back navigation after logout
      window.history.replaceState(null, '', '../login.html');
      window.location.replace('../login.html');
    });
  }
  // Prevent back navigation to admin pages after logout
  window.addEventListener('popstate', () => {
    if (!getToken()) {
      window.location.replace('../login.html');
    }
  });
}

function renderOverview(db) {
  qs("totalUsers").textContent = db.users.length;
  qs("totalDocs").textContent = db.content.length;
  qs("totalSummaries").textContent = db.summaries.length;

  const topUsers = [...db.users]
    .sort((a, b) => (b.uploads + b.summaries) - (a.uploads + a.summaries))
    .slice(0, 3)
    .map((u) => `<li>${u.name} - ${u.uploads + u.summaries} actions</li>`)
    .join("");
  qs("mostActiveUsers").innerHTML = topUsers;

  const bySubject = {};
  db.content.forEach((c) => {
    bySubject[c.subject] = (bySubject[c.subject] || 0) + 1;
  });
  const subjects = Object.entries(bySubject)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `<li>${name} - ${count} items</li>`)
    .join("");
  qs("mostAccessedSubjects").innerHTML = subjects || "<li>No data</li>";

  drawLineChart("activityChart", db.metrics.activity.daily, "#0ea5e9");
  drawLineChart("healthChart", db.metrics.responseTime, "#ef6c00");

  qs("apiUsageVal").textContent = db.metrics.apiUsage.at(-1) + " req/min";
  qs("errorRateVal").textContent = db.metrics.errorRate.at(-1) + "%";
  qs("responseTimeVal").textContent = db.metrics.responseTime.at(-1) + " ms";
}

function renderContent(db) {
  const previewBox = qs("summaryPreview");
  const cachedPreview = localStorage.getItem(LAST_BULK_PREVIEW_KEY);
  if (previewBox && cachedPreview) {
    previewBox.value = cachedPreview;
  }

  const rows = db.content.map((c) => `
    <tr>
      <td>${c.title}</td>
      <td>${c.subject}</td>
      <td>${c.chapter}</td>
      <td>${c.difficulty}</td>
      <td><span class="tag">${c.format}</span></td>
      <td>v${c.version}</td>
      <td>${c.status}</td>
      <td class="row">
        ${c.url ? `<button onclick="window.open('${API_BASE}${c.url}', '_blank')">View</button>` : ''}
          <button data-edit-content="${c.id}">Edit</button>
        <button class="btn-danger" data-delete-content="${c.id}">Delete</button>
      </td>
    </tr>
  `).join("");
  qs("contentRows").innerHTML = rows;

  qs("uploadForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = qs("contentTitle").value.trim();
      const subject = qs("contentSubject").value;
      const chapter = qs("contentChapter").value.trim();
      const difficulty = qs("contentDifficulty").value;
      const file = qs("contentFile").files[0];
      if (!title || !chapter || !file) return;
  
      const formData = new FormData();
      formData.append("contentFile", file);
  
      const token = getToken();
      let urlInfo = "";
      try {
        const uploadRes = await fetch(API_BASE + "/api/admin/upload-file", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body: formData
        });
        const uploadData = await uploadRes.json();
        urlInfo = uploadData.url || "";
      } catch(err) {
        console.error(err);
        alert("File upload failed!");
        return;
      }
  
      const format = (file.name.split(".").pop() || "TXT").toUpperCase();
      db.content.push({
        id: "c" + Date.now(), title, subject, chapter, difficulty, format, version: 1, status: "Published", url: urlInfo
      });
      saveAndReload(db);
    });

  qs("bulkUpload").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    const uploadedItems = [];

    files.forEach((f, i) => {
      const newItem = {
        id: "cb" + Date.now() + i,
        title: f.name.replace(/\.[^.]+$/, ""),
        subject: "General",
        chapter: "Bulk Import",
        difficulty: "Medium",
        format: (f.name.split(".").pop() || "TXT").toUpperCase(),
        version: 1,
        status: "Published"
      };
      uploadedItems.push(newItem);
      db.content.push(newItem);
    });

    let previewText = "";
    try {
      const previews = await requestBulkPreviewFromFiles(files, uploadedItems, "medium");
        
        previews.forEach((p, idx) => {
           if (p.url && uploadedItems[idx]) {
             uploadedItems[idx].url = p.url;
             const dbItem = db.content.find(c => c.id === uploadedItems[idx].id);
             if (dbItem) dbItem.url = p.url;
           }
        });

      previewText = previews
        .map((p, idx) => `${idx + 1}. ${p.title}\n${p.preview}`)
        .join("\n\n---\n\n");
    } catch (err) {
      previewText = `Preview generation failed: ${err.message || "Unknown error"}.\n\nTry a smaller file or a text-based PDF/DOCX.`;
    }

    localStorage.setItem(LAST_BULK_PREVIEW_KEY, previewText);
    if (previewBox) previewBox.value = previewText;

    saveAndReload(db);
  });

  document.addEventListener("click", (e) => {
    const del = e.target.closest("[data-delete-content]");
    if (del) {
      const id = del.getAttribute("data-delete-content");
      db.content = db.content.filter((c) => c.id !== id);
      saveAndReload(db);
    }
    const edit = e.target.closest("[data-edit-content]");
    if (edit) {
      const id = edit.getAttribute("data-edit-content");
      const item = db.content.find((c) => c.id === id);
      if (!item) return;

      const nextTitle = prompt("Edit title", item.title);
      if (nextTitle === null) return;

      const nextSubject = prompt("Edit subject", item.subject);
      if (nextSubject === null) return;

      const nextChapter = prompt("Edit chapter", item.chapter);
      if (nextChapter === null) return;

      const nextDifficulty = prompt("Edit difficulty (Easy/Medium/Hard)", item.difficulty);
      if (nextDifficulty === null) return;

      item.title = nextTitle.trim() || item.title;
      item.subject = nextSubject.trim() || item.subject;
      item.chapter = nextChapter.trim() || item.chapter;
      item.difficulty = nextDifficulty.trim() || item.difficulty;
      item.version += 1;
      item.status = "Review";

      const preview = qs("summaryPreview");
      if (preview) {
        preview.value = `Preview for ${item.title} (v${item.version})\n\nUpdated metadata:\n- Subject: ${item.subject}\n- Chapter: ${item.chapter}\n- Difficulty: ${item.difficulty}`;
      }

      saveAndReload(db);
    }
  });
}

function renderUsers(db) {
  const q = (qs("userSearch").value || "").toLowerCase();
  const role = qs("userRoleFilter").value;
  const filtered = db.users.filter((u) => {
    const textMatch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const roleMatch = role === "All" || u.role === role;
    return textMatch && roleMatch;
  });

  qs("userRows").innerHTML = filtered.map((u) => `
    <tr>
      <td>${u.name}<div class="small muted">${u.email}</div></td>
      <td>
        <select data-role-user="${u.id}">
          ${["Student", "Premium", "Admin"].map((r) => `<option ${u.role === r ? "selected" : ""}>${r}</option>`).join("")}
        </select>
      </td>
      <td>${u.uploads}</td>
      <td>${u.summaries}</td>
      <td>${u.banned ? "Banned" : "Active"}</td>
      <td class="row">
        <button data-ban-user="${u.id}">${u.banned ? "Unban" : "Ban"}</button>
        <button data-reset-user="${u.id}">Reset Password</button>
      </td>
    </tr>
  `).join("");

  qs("userSearch").addEventListener("input", () => renderUsers(db));
  qs("userRoleFilter").addEventListener("change", () => renderUsers(db));

  document.addEventListener("change", (e) => {
    const roleSel = e.target.closest("[data-role-user]");
    if (!roleSel) return;
    const id = roleSel.getAttribute("data-role-user");
    const u = db.users.find((x) => x.id === id);
    if (!u) return;
    u.role = roleSel.value;
    setDb(db);
  });

  document.addEventListener("click", (e) => {
    const ban = e.target.closest("[data-ban-user]");
    if (ban) {
      const id = ban.getAttribute("data-ban-user");
      const u = db.users.find((x) => x.id === id);
      if (!u) return;
      u.banned = !u.banned;
      setDb(db);
      renderUsers(db);
    }
    const reset = e.target.closest("[data-reset-user]");
    if (reset) {
      alert("Password reset link queued for user.");
    }
  });
}

function renderCategories(db) {
  const rows = db.categories.map((c, idx) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.chapter}</td>
      <td>${c.subtopic}</td>
      <td class="row">
        <button data-up-cat="${idx}">Up</button>
        <button data-down-cat="${idx}">Down</button>
        <button class="btn-danger" data-del-cat="${idx}">Delete</button>
      </td>
    </tr>
  `).join("");
  qs("catRows").innerHTML = rows;

  qs("catForm").addEventListener("submit", (e) => {
    e.preventDefault();
    db.categories.push({
      id: "cat" + Date.now(),
      name: qs("subjName").value.trim(),
      chapter: qs("chapterName").value.trim(),
      subtopic: qs("subtopicName").value.trim()
    });
    saveAndReload(db);
  });

  document.addEventListener("click", (e) => {
    const up = e.target.closest("[data-up-cat]");
    const down = e.target.closest("[data-down-cat]");
    const del = e.target.closest("[data-del-cat]");
    if (up) {
      const i = Number(up.getAttribute("data-up-cat"));
      if (i > 0) [db.categories[i - 1], db.categories[i]] = [db.categories[i], db.categories[i - 1]];
      saveAndReload(db);
    }
    if (down) {
      const i = Number(down.getAttribute("data-down-cat"));
      if (i < db.categories.length - 1) [db.categories[i + 1], db.categories[i]] = [db.categories[i], db.categories[i + 1]];
      saveAndReload(db);
    }
    if (del) {
      const i = Number(del.getAttribute("data-del-cat"));
      db.categories.splice(i, 1);
      saveAndReload(db);
    }
  });
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderFeedback(db) {
  const avg = db.feedback.reduce((a, f) => a + f.rating, 0) / Math.max(db.feedback.length, 1);
  qs("avgRating").textContent = avg.toFixed(2);

  const weak = db.summaries
    .filter((s) => s.feedbackAvg < 3.2)
    .map((s) => `<li>${s.title} - ${s.feedbackAvg}</li>`)
    .join("");
  qs("weakSummaryList").innerHTML = weak || "<li>None currently</li>";

  qs("feedbackRows").innerHTML = db.feedback.map((f) => `
    <tr>
      <td>${f.summaryId}</td>
      <td>${f.rating}</td>
      <td>${f.comment}</td>
    </tr>
  `).join("");

  qs("updatePrompt").addEventListener("click", () => {
    alert("AI prompt tuning workflow queued based on weak summary feedback.");
  });
}

function renderNotifications(db) {
  qs("noticeRows").innerHTML = db.notifications.map((n) => `
    <tr>
      <td>${n.title}</td>
      <td>${n.audience}</td>
      <td>${n.at}</td>
      <td>${n.body}</td>
    </tr>
  `).join("");

  qs("noticeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const notice = {
      title: qs("noticeTitle").value.trim(),
      body: qs("noticeBody").value.trim(),
      audience: qs("noticeAudience").value,
    };

    if (!notice.title || !notice.body) return;

    try {
      const result = await sendAnnouncement(notice);
      db.notifications = Array.isArray(result.notifications) ? result.notifications : db.notifications;
      qs("noticeRows").innerHTML = db.notifications.map((n) => `
        <tr>
          <td>${n.title}</td>
          <td>${n.audience}</td>
          <td>${n.at}</td>
          <td>${n.body}</td>
        </tr>
      `).join("");
      e.target.reset();
      alert("Announcement sent.");
    } catch (err) {
      alert(err.message || "Failed to send announcement");
    }
  });
}

function renderInsights(db) {
  qs("struggleRows").innerHTML = db.metrics.strugglingSubjects
    .map(([name, score]) => `<tr><td>${name}</td><td>${score}%</td></tr>`).join("");
  qs("chapterRows").innerHTML = db.metrics.summarizedChapters
    .map(([name, count]) => `<tr><td>${name}</td><td>${count}</td></tr>`).join("");
  qs("peakRows").innerHTML = db.metrics.peakHours
    .map(([slot, load]) => `<tr><td>${slot}</td><td>${load}</td></tr>`).join("");
}

function renderQuizzes() {
  const localState = {
    adminQuizzes: [],
    doubtQuizzes: [],
    heatmap: [],
    catalog: null,
    builderQuestions: [], // The questions in the editor
    activeTopic: null // Track currently clicked topic for side panel
  };

  const TOPIC_SUBJECT_MAP = {
    'kinematics': 'Physics',
    'laws of motion': 'Physics',
    'work energy power': 'Physics',
    'thermodynamics': 'Physics',
    'electrostatics': 'Physics',
    'organic chemistry': 'Chemistry',
    'chemical bonding': 'Chemistry',
    'calculus': 'Math',
    'probability': 'Math'
  };

  function getSubject(topic) {
    const t = String(topic).toLowerCase();
    return TOPIC_SUBJECT_MAP[t] || 'General';
  }

  function heatColor(score) {
    const safe = Math.max(0, Math.min(1, Number(score) || 0));
    if (safe < 0.5) {
      const t = safe / 0.5;
      const r = Math.round(16 + 229 * t);
      const g = Math.round(185 - 27 * t);
      const b = Math.round(129 - 118 * t);
      return `rgba(${r},${g},${b},0.22)`;
    } else {
      const t = (safe - 0.5) / 0.5;
      const r = Math.round(245 - 25 * t);
      const g = Math.round(158 - 120 * t);
      const b = Math.round(11 + 27 * t);
      return `rgba(${r},${g},${b},${(0.25 + t * 0.25).toFixed(2)})`;
    }
  }

  function renderHeatmap() {
    const container = qs("heatmapSubjectGrid");
    if (!container) return;

    const heatmap = Array.isArray(localState.heatmap) ? localState.heatmap : [];
    if (!heatmap.length) {
      container.innerHTML = `<div class="muted small">No performance data yet.</div>`;
      return;
    }

    // Group heatmap topics by subject
    const grouped = heatmap.reduce((acc, row) => {
      const subj = getSubject(row.topic);
      if (!acc[subj]) acc[subj] = [];
      acc[subj].push(row);
      return acc;
    }, {});

    container.innerHTML = Object.entries(grouped).map(([subj, rows]) => {
      const chips = rows.map(row => {
        const style = `--heat-color: ${heatColor(row.difficultyScore)};`;
        return `<div class="topic-chip" style="${style}" data-topic-chip="${row.topic}">
          <div class="chip-name">${row.displayTopic || row.topic}</div>
          <div class="chip-stats">
            <span class="badge" style="background:#fff; color:var(--bad)">${row.pctStruggling}% strg</span>
            <span class="badge" style="background:#fff; color:var(--ink-muted)">${row.attempts} att</span>
          </div>
        </div>`;
      }).join("");

      return `<div class="subject-card">
        <div class="subject-header">${subj}</div>
        <div class="topic-chip-grid">${chips}</div>
      </div>`;
    }).join("");
  }

  async function openTopicInsight(topic) {
    const listContainer = qs("panelStudentList");
    const nameLabel = qs("panelTopicName");
    if (!listContainer || !nameLabel) return;
    
    localState.activeTopic = topic;
    nameLabel.textContent = topic;
    listContainer.innerHTML = `<div class="muted small text-center" style="padding:20px;">Loading students...</div>`;
    qs("studentInsightPanel").classList.add("open");

    try {
      const data = await apiRequest(`/api/admin/heatmap/topic/${encodeURIComponent(topic)}/students`, { method: "GET" });
      const students = data.students || [];

      if (!students.length) {
        listContainer.innerHTML = `<div class="muted small text-center" style="padding:20px;">No students struggling here.</div>`;
        return;
      }

      listContainer.innerHTML = students.map(s => {
        const accPct = Math.round(s.accuracy * 100);
        return `<div class="student-row">
          <div class="name">${s.userId}</div>
          <div>
            <span class="muted small" style="margin-right: 8px;">${s.attempts} att</span>
            <span class="acc">${accPct}% acc</span>
          </div>
        </div>`;
      }).join("");
    } catch (err) {
      listContainer.innerHTML = `<div class="muted small" style="color:var(--bad)">Failed to load students.</div>`;
    }
  }

  function closeTopicInsight() {
    const p = qs("studentInsightPanel");
    if(p) p.classList.remove("open");
    localState.activeTopic = null;
  }

  function renderCreationConfig(catalog) {
    const container = qs("creationTopicCheckboxes");
    if (!container || !catalog) return;
    
    // catalog.topics is an array of { topic, displayTopic, subject, count }
    const topicsArr = Array.isArray(catalog.topics) ? catalog.topics : [];
    if (!topicsArr.length) {
      container.innerHTML = `<span class="muted small">No topics in bank.</span>`;
      return;
    }

    // Group by subject
    const grouped = topicsArr.reduce((acc, t) => {
      const subj = t.subject || getSubject(t.topic);
      if (!acc[subj]) acc[subj] = [];
      acc[subj].push(t);
      return acc;
    }, {});

    container.innerHTML = Object.entries(grouped).map(([subj, topics]) => {
      const cbs = topics.map(t => {
        const val = typeof t === 'string' ? t : t.topic;
        const display = typeof t === 'string' ? t : (t.displayTopic || t.topic);
        return `<label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;"><input type="checkbox" data-cb-topic="${val}" /> <span>${display}</span></label>`;
      }).join("");
      
      return `<details open style="margin-bottom: 8px; border: 1px solid var(--line); border-radius: 6px; padding: 4px 10px;">
        <summary style="font-weight:700; font-size:14px; cursor:pointer; list-style:none; padding:4px 0; display:flex; justify-content:space-between; align-items:center;">
           <span>${subj}</span> 
           <span class="muted" style="display:flex; align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
        </summary>
        <div class="grid cols-3" style="gap: 12px; padding: 10px 0;">${cbs}</div>
      </details>`;
    }).join("");
  }

  function getSelectedConfigTopics() {
    return Array.from(document.querySelectorAll("input[data-cb-topic]:checked")).map(el => el.getAttribute("data-cb-topic"));
  }

  async function startEditorFlow(topics) {
    if (!topics.length) {
      alert("Please select at least one topic.");
      return;
    }
    
    closeTopicInsight(); // close side panel if open
    qs("mainView").style.display = "none";
    qs("editorView").style.display = "block";
    
    // Check if timeline loader exists (added to HTML)
    const loader = qs("timelineLoader");
    const editorLayout = qs("editorLayout");
    if(loader) loader.style.display = "flex";
    if(editorLayout) editorLayout.style.display = "none";
    
    // Timeline steps animation
    const setStep = (num) => {
      [1, 2, 3].forEach(i => {
        const el = qs(`tStep${i}`);
        if(el) {
          if (i === num) el.classList.add("active");
          else el.classList.remove("active");
          if (i < num) el.style.opacity = "1";
        }
      });
    };

    setStep(1);
    await new Promise(r => setTimeout(r, 600)); // Simulate analysis
    
    setStep(2);
    // Fetch priority questions based on config
    try {
      const count = parseInt(qs("configTotalQ")?.value || "10", 10);
      const limitPerTopic = Math.max(1, Math.floor(count / topics.length));
      let allQuestions = [];
      
      // Fetch for each topic independently
      for (const t of topics) {
        const qData = await apiRequest(`/api/admin/doubt-quizzes/suggest?topic=${encodeURIComponent(t)}&count=${limitPerTopic}`, { method: "GET" });
        if (qData && qData.questions) {
          allQuestions.push(...qData.questions);
        }
      }
      
      localState.builderQuestions = allQuestions;

      // If no suggestion fallback to normal query for mixed topics
      if (!localState.builderQuestions.length) {
         const normalData = await apiRequest(`/api/admin/question-bank?topics=${encodeURIComponent(topics.join(','))}&difficulty=all&limit=${count}`, { method: 'GET' });
         localState.builderQuestions = normalData.questions || [];
      }

    } catch (e) {
      console.warn("Editor prep fetch fail", e);
    }
    await new Promise(r => setTimeout(r, 600)); // Simulate mapping
    
    setStep(3);
    const titleInp = qs("editorQuizTitle");
    if(titleInp) titleInp.value = `Targeted Assignment - ${topics[0].charAt(0).toUpperCase() + topics[0].slice(1)}${topics.length > 1 ? ' & more' : ''}`;
    await new Promise(r => setTimeout(r, 400));
    
    if(loader) loader.style.display = "none";
    if(editorLayout) editorLayout.style.display = "flex";
    
    renderEditorSidebar();
    
    if (localState.builderQuestions.length > 0) {
      selectQuestionItem(localState.builderQuestions[0], 0);
    } else {
      qs("editorPreviewParams").innerHTML = `<div class="muted" style="text-align:center; margin-top: 40px;">No questions matched the criteria.</div>`;
    }
  }

  function renderEditorSidebar() {
    const listContainer = qs("editorQList");
    if (!listContainer) return;
    qs("editorQCount").textContent = localState.builderQuestions.length;

    if (localState.builderQuestions.length === 0) {
      listContainer.innerHTML = `<div class="muted small" style="padding:12px;">No questions selected.</div>`;
      return;
    }

    // Group builderQuestions by topic
    const grouped = localState.builderQuestions.reduce((acc, q, idx) => {
      const topic = q.topic || 'General';
      if (!acc[topic]) acc[topic] = [];
      q._originalIdx = idx; // retain original index for replace/remove
      acc[topic].push(q);
      return acc;
    }, {});

    listContainer.innerHTML = Object.entries(grouped).map(([topic, qs]) => {
      const cards = qs.map((q) => {
        const idx = q._originalIdx;
        const diffLabel = q.difficulty || 'medium';
        return `<div class="eq-card" data-eq-idx="${idx}">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${idx + 1}. ${q.question}
          </div>
          <div class="row" style="justify-content:space-between; align-items:center;">
             <div>
               <span class="badge" style="background:#eef2ff; color:var(--brand)">${diffLabel}</span>
             </div>
             <div class="q-actions" style="display:flex; gap:6px;">
               <button class="btn btn-sm" data-eq-replace="${idx}" title="Replace" style="padding:4px 8px; display:flex; align-items:center; gap:4px;">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
               </button>
               <button class="btn btn-sm btn-danger" data-eq-remove="${idx}" title="Remove" style="padding:4px 8px; display:flex; align-items:center; gap:4px;">
                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
             </div>
          </div>
        </div>`;
      }).join("");

      return `<div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--ink-muted); text-transform: uppercase; margin-bottom: 8px;">${topic} (${qs.length})</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">${cards}</div>
      </div>`;
    }).join("");

    // Auto select first
    if (localState.builderQuestions.length > 0) {
      selectEditorQuestion(0);
    }
  }

  function selectEditorQuestion(idx) {
    document.querySelectorAll(".eq-card").forEach(el => el.classList.remove("active"));
    const card = document.querySelector(`.eq-card[data-eq-idx="${idx}"]`);
    if(card) card.classList.add("active");

    const q = localState.builderQuestions[idx];
    const previewContainer = qs("editorPreviewParams");
    if(!q || !previewContainer) return;

    const optsMarkup = (q.options || []).map((o, oi) => {
      const isCorrect = oi === q.correctIndex;
      return `<div style="padding: 12px; border: 1px solid ${isCorrect ? 'var(--good)' : 'var(--line)'}; background: ${isCorrect ? 'rgba(16, 185, 129, 0.05)' : '#fff'}; border-radius: 8px; margin-bottom: 8px; font-weight: ${isCorrect ? '600' : '400'}; position: relative;">
        ${String.fromCharCode(65 + oi)}) ${o} 
        ${isCorrect ? `<span style="float:right; color:var(--good); display:flex; align-items:center; gap:4px; font-size:11px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          CORRECT
        </span>` : ''}
      </div>`;
    }).join("");

    previewContainer.innerHTML = `
      <div class="row" style="margin-bottom: 16px; gap: 8px;">
        <span class="badge" style="background:#e2e8f0;">${q.topic}</span>
        <span class="badge" style="background:#eef2ff; color:var(--brand);">${q.difficulty || 'medium'}</span>
      </div>
      <h3 style="margin-top:0; font-size: 18px; line-height:1.4;">${q.question}</h3>
      <div style="margin-top: 24px;">
        ${optsMarkup}
      </div>
    `;
  }

  async function handleReplaceQuestion(idx) {
    const qToRemove = localState.builderQuestions[idx];
    const excludeIds = localState.builderQuestions.map(q => q.id).join(",");
    
    try {
      // Trigger visually
      const previewContainer = qs("editorPreviewParams");
      if(previewContainer) previewContainer.innerHTML = `<div class="muted" style="text-align:center; padding-top: 40px;">Finding replacement...</div>`;

      const data = await apiRequest(`/api/admin/question-bank/replace?topic=${encodeURIComponent(qToRemove.topic)}&excludeIds=${encodeURIComponent(excludeIds)}`, { method: "GET" });
      
      if (data.question) {
        localState.builderQuestions[idx] = data.question;
        renderEditorSidebar();
        selectEditorQuestion(idx);
      } else {
        throw new Error("No replacement found");
      }
    } catch (err) {
      alert(err.message || "No replacement found for this topic.");
      selectEditorQuestion(idx);
    }
  }

  // ── Delegated Clicks (Single Listener for Component) ───────────────────
  // We attach it to `#mainView` and `#editorView` wrappers or just document
  // But to avoid duplicate listeners on re-renders, it's safe to use the single document listener 
  // Wait, `renderQuizzes` shouldn't add a document listener every time. 
  // Let's bind to a specific container if we can, or just clear old if needed.
  if(!window._editorDelegated) {
    window._editorDelegated = true;
    document.addEventListener("click", (e) => {
      // Open Student Insight from Heatmap chip
      const chip = e.target.closest("[data-topic-chip]");
      if (chip) {
        openTopicInsight(chip.getAttribute("data-topic-chip"));
        return;
      }

      // Side panel actions
      if (e.target.closest("#closePanelBtn")) {
        closeTopicInsight();
        return;
      }
      if (e.target.closest("#panelCreateDoubtBtn")) {
        if(localState.activeTopic) {
          // Find checkbox and set it true
          const cb = document.querySelector(`input[data-cb-topic="${localState.activeTopic}"]`);
          if(cb) cb.checked = true;
          // Start flow
          startEditorFlow([localState.activeTopic]);
        }
        return;
      }

      // Config Builder action
      if (e.target.closest("#initQuizFlowBtn")) {
        const selected = getSelectedConfigTopics();
        startEditorFlow(selected);
        return;
      }

      // Editor internal actions
      const eqCard = e.target.closest("[data-eq-idx]");
      if (eqCard && !e.target.closest(".q-actions")) {
         selectEditorQuestion(parseInt(eqCard.getAttribute("data-eq-idx"), 10));
         return;
      }

      const removeBtn = e.target.closest("[data-eq-remove]");
      if (removeBtn) {
         const idx = parseInt(removeBtn.getAttribute("data-eq-remove"), 10);
         localState.builderQuestions.splice(idx, 1);
         renderEditorSidebar();
         return;
      }

      const replaceBtn = e.target.closest("[data-eq-replace]");
      if(replaceBtn) {
         const idx = parseInt(replaceBtn.getAttribute("data-eq-replace"), 10);
         handleReplaceQuestion(idx);
         return;
      }

      // Editor Back
      if (e.target.closest("#editorBackBtn")) {
         qs("editorLayout").style.display = "none";
         qs("editorView").style.display = "none";
         qs("mainView").style.display = "block";
         localState.builderQuestions = [];
         return;
      }
      
      // Editor Save & Assign
      if (e.target.closest("#editorSaveBtn")) {
        saveAndAssignQuiz();
      }
    });
  }

  async function saveAndAssignQuiz() {
    const title = qs("editorQuizTitle")?.value?.trim() || "Untitled Quiz";
    if (!localState.builderQuestions.length) { alert("No questions to save."); return; }
    
    const target = qs("editorAssignTarget").value;
    let userIds = [];
    if (target === "custom") {
      const customStr = prompt("Enter Student IDs/Emails separated by comma:");
      if(customStr === null) return;
      userIds = customStr.split(",").map(s => s.trim()).filter(Boolean);
    }
    const assignAllStudents = target === "all";

    const topicsSet = new Set(localState.builderQuestions.map(q => q.topic).filter(Boolean));

    try {
      await apiRequest("/api/admin/quizzes", {
        method: "POST",
        body: JSON.stringify({
          title,
          topics: Array.from(topicsSet),
          difficulty: "medium", // can be dynamic based on config
          questionCount: localState.builderQuestions.length,
          autoGenerate: false,
          questions: localState.builderQuestions,
          userIds,
          assignAllStudents,
        }),
      });
      localState.builderQuestions = [];
      qs("editorQuizTitle").value = "";
      const el = qs("editorLayout"); if(el) el.style.display = "none";
      const ev = qs("editorView"); if(ev) ev.style.display = "none";
      const mv = qs("mainView"); if(mv) mv.style.display = "block";
      await loadQuizLists();
      alert("Quiz created and assigned successfully!");
    } catch (err) {
      alert(err.message || "Failed to create quiz");
    }
  }


  // ── Tables ────────────────────────────────────────────────────────
  function quizRowMarkup(type, quiz) {
    const topics = (quiz.topics || []).join(", ") || "-";
    const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
    const assigned = Array.isArray(quiz.assignedTo) ? quiz.assignedTo.length : 0;
    const key = `${type}:${quiz.id}`;
    return `<tr>
      <td>${quiz.title || "Untitled"}</td>
      <td>${topics}</td>
      <td>${qCount}</td>
      <td class="row">
        <span class="badge" style="background:#f8fafc; border:1px solid var(--line);">${assigned} Assigned</span>
        <button class="btn btn-sm" style="display:flex; align-items:center; gap:4px;" onclick="alert('Viewing/Editing functionality coming soon')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          Edit
        </button>
      </td>
    </tr>`;
  }

  function renderQuizTables() {
    const adminQuizRows = qs("adminQuizRows");
    const doubtQuizRows = qs("doubtQuizRows");
    if(adminQuizRows) {
      adminQuizRows.innerHTML = localState.adminQuizzes.length
        ? localState.adminQuizzes.map((quiz) => quizRowMarkup("AdminQuiz", quiz)).join("")
        : `<tr><td colspan="4">No admin quizzes yet</td></tr>`;
    }
    if(doubtQuizRows) {
      doubtQuizRows.innerHTML = localState.doubtQuizzes.length
        ? localState.doubtQuizzes.map((quiz) => quizRowMarkup("DoubtQuiz", quiz)).join("")
        : `<tr><td colspan="4">No doubt quizzes yet</td></tr>`;
    }
  }

  // ── Loaders ────────────────────────────────────────────────────────
  const rfBtn = qs("refreshHeatmapBtn");
  if(rfBtn && !rfBtn._bound) {
    rfBtn._bound = true;
    rfBtn.addEventListener("click", () => {
      loadHeatmap().catch((err) => alert(err.message || "Failed to refresh heatmap"));
    });
  }

  async function loadHeatmap() {
    const data = await apiRequest("/api/admin/heatmap", { method: "GET" });
    localState.heatmap = Array.isArray(data.heatmap) ? data.heatmap : [];
    renderHeatmap();
  }

  async function loadQuizLists() {
    const [adminRes, doubtRes] = await Promise.all([
      apiRequest("/api/admin/quizzes", { method: "GET" }),
      apiRequest("/api/admin/doubt-quizzes", { method: "GET" }),
    ]);
    localState.adminQuizzes = Array.isArray(adminRes.quizzes) ? adminRes.quizzes : [];
    localState.doubtQuizzes = Array.isArray(doubtRes.quizzes) ? doubtRes.quizzes : [];
    renderQuizTables();
  }

  async function loadCatalog() {
    try {
      const data = await apiRequest("/api/admin/question-bank?limit=1", { method: "GET" });
      localState.catalog = data.catalog || null;
      renderCreationConfig(localState.catalog);
    } catch (_) {}
  }

  // Boot
  Promise.all([loadHeatmap(), loadQuizLists(), loadCatalog()]).catch((err) => {
    console.error("Quiz studio boot error:", err);
  });
}


function renderBackup(db) {
  const pct = Math.round((db.backup.storageUsedMb / db.backup.storageLimitMb) * 100);
  qs("backupWhen").textContent = db.backup.lastBackup;
  qs("storageUsed").textContent = `${db.backup.storageUsedMb}MB / ${db.backup.storageLimitMb}MB`;
  qs("storageBar").style.width = pct + "%";

  qs("createBackup").addEventListener("click", () => {
    db.backup.lastBackup = new Date().toLocaleString();
    downloadText("adapted-backup.json", JSON.stringify(db, null, 2));
    saveAndReload(db);
  });

  qs("restoreBackup").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      saveAndReload(parsed);
    } catch (_) {
      alert("Invalid backup file");
    }
  });
}

function mountModule(moduleKey, db) {
  if (moduleKey === "overview") return renderOverview(db);
  if (moduleKey === "content") return renderContent(db);
  if (moduleKey === "quizzes") return renderQuizzes(db);
  if (moduleKey === "users") return renderUsers(db);
  if (moduleKey === "categories") return renderCategories(db);
  if (moduleKey === "feedback") return renderFeedback(db);
  if (moduleKey === "notifications") return renderNotifications(db);
  if (moduleKey === "insights") return renderInsights(db);
  if (moduleKey === "backup") return renderBackup(db);
}

async function boot() {
  if (!(await ensureAdminAccess())) return;
  const root = document.body;
  const moduleKey = root.getAttribute("data-module") || "overview";
  setNav(moduleKey);
  setupNavAutoHide();
  setHeader(moduleKey);
  wireCommonActions();
  const db = await refreshDbFromApi();
  mountModule(moduleKey, db);
}

document.addEventListener("DOMContentLoaded", boot);
