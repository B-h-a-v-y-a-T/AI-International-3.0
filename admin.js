const DB_KEY = "admin-local-db-v1";
const APP_STATE_KEY = "admin-app-state-v1";
const ADMIN_LOGIN_ROLE = "ls-login-role";
const ORIGIN = window.location.origin;
const API_BASE = window.API || ((ORIGIN && ORIGIN !== "null") ? ORIGIN : "http://localhost:5000");
const LAST_BULK_PREVIEW_KEY = "admin-last-bulk-preview";

const navItems = [
  ["overview", "admin/index.html", "Dashboard"],
  ["content", "admin/content.html", "Content CMS"],
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
  } catch (_) {
    window.location.href = "../login.html";
    return false;
  }
}

function seedData() {
  const existing = localStorage.getItem(DB_KEY);
  if (existing) return;
  const db = {
    users: [
      { id: "u1", name: "Karan Patil", email: "karan@demo.com", role: "Student", banned: false, uploads: 5, summaries: 23, lastSeen: "2h ago" },
      { id: "u2", name: "Riya Nair", email: "riya@demo.com", role: "Premium", banned: false, uploads: 14, summaries: 52, lastSeen: "15m ago" },
      { id: "u3", name: "Amit Gupta", email: "amit@demo.com", role: "Student", banned: true, uploads: 1, summaries: 2, lastSeen: "5d ago" },
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
      localStorage.removeItem("ls-token");
      localStorage.removeItem("ls-user");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      localStorage.removeItem(ADMIN_LOGIN_ROLE);
      window.location.href = "../login.html";
    });
  }
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
  
      const token = localStorage.getItem("ls-token");
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
