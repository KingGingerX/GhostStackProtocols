// script.js — Ghost Stack Protocols (Vercel + GitHub)
// UI lock + server-side gate via middleware cookie "gs_access".
// IMPORTANT: This is still "shared-key" auth. For strongest security, replace with a serverless login
// that mints a signed session cookie (ask and I’ll drop that full version).

// Clean tool routes (rewritten by vercel.json to the .html files)
const toolLinks = {
  "Spectre69": "/tools/spectre69",
  "EvilTacos": "/tools/eviltacos",
  "DarkForge-X": "/tools/darkforge-x",
  "GravePoint-Directive": "/tools/gravepoint-directive"
};

// Demo credential allowlist (Operator ID + Keyphrase).
// IMPORTANT: For the middleware-gate to work in this simple version,
// the keyphrase must equal your Vercel env var GHOSTSTACK_TOKEN.
const VALID = [
  { opId: "GOODY", keyphrase: "GHOSTSTACK" },
  { opId: "OPERATOR", keyphrase: "SPECTRE" }
];

// ---- DOM
const authForm = document.getElementById("authForm");
const opIdEl = document.getElementById("opId");
const keyEl = document.getElementById("keyphrase");
const msgEl = document.getElementById("msg");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const lockBtn = document.getElementById("lockBtn");
const toolEls = [...document.querySelectorAll(".tool")];

// ---- helpers
function setStatus(unsealed) {
  if (unsealed) {
    statusDot.classList.add("ok");
    statusText.textContent = "UNSEALED";
  } else {
    statusDot.classList.remove("ok");
    statusText.textContent = "SEALED";
  }
}

function setAccessCookie(token) {
  // 7 days
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `gs_access=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}

function clearAccessCookie() {
  document.cookie = "gs_access=; Path=/; Max-Age=0; SameSite=Lax; Secure";
}

function lockTools() {
  clearAccessCookie();

  toolEls.forEach(a => {
    a.classList.add("locked");
    a.classList.remove("unlocked");
    a.setAttribute("href", "#");
    const badge = a.querySelector(".badge");
    if (badge) badge.textContent = "LOCKED";
  });

  setStatus(false);
  msgEl.textContent = "Access sealed.";
}

function unlockTools(tokenToSet) {
  // Middleware checks this cookie value equals process.env.GHOSTSTACK_TOKEN
  setAccessCookie(tokenToSet);

  toolEls.forEach(a => {
    const name = a.dataset.tool;
    a.classList.remove("locked");
    a.classList.add("unlocked");
    a.setAttribute("href", toolLinks[name] || "#");
    const badge = a.querySelector(".badge");
    if (badge) badge.textContent = "OPEN";
  });

  setStatus(true);
  msgEl.textContent = "Credentials accepted. Tools unlocked.";
}

function validCredentials(opId, keyphrase) {
  const A = (opId || "").trim().toUpperCase();
  const B = (keyphrase || "").trim();
  return VALID.some(v => v.opId === A && v.keyphrase === B);
}

function getCookie(name) {
  const parts = document.cookie.split(";").map(s => s.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return "";
}

// ---- events
authForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const op = opIdEl.value;
  const key = keyEl.value;

  if (!validCredentials(op, key)) {
    msgEl.textContent = "Denied. Invalid operator ID or keyphrase.";
    setStatus(false);
    return;
  }

  // SIMPLE MODE:
  // Use keyphrase as the server token (must match Vercel env var GHOSTSTACK_TOKEN)
  unlockTools(key.trim());

  // Clean up key input
  keyEl.value = "";
});

lockBtn.addEventListener("click", () => lockTools());

// Prevent clicks while locked
toolEls.forEach(a => {
  a.addEventListener("click", (e) => {
    if (a.classList.contains("locked")) {
      e.preventDefault();
      msgEl.textContent = "Denied. Authenticate to access tools.";
    }
  });
});

// ---- bootstrap
(function init() {
  // Show message if redirected from middleware
  const params = new URLSearchParams(location.search);
  if (params.get("denied") === "1") {
    msgEl.textContent = "Denied. Tools are sealed server-side.";
  }

  // If cookie exists, reflect unlocked UI (note: middleware will still enforce)
  const token = getCookie("gs_access");
  if (token) {
    toolEls.forEach(a => {
      const name = a.dataset.tool;
      a.classList.remove("locked");
      a.classList.add("unlocked");
      a.setAttribute("href", toolLinks[name] || "#");
      const badge = a.querySelector(".badge");
      if (badge) badge.textContent = "OPEN";
    });
    setStatus(true);
  } else {
    lockTools();
  }
})();