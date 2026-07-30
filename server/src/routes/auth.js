const express = require("express");
const db = require("../db");
const { hashPassword, verifyPassword, generateToken } = require("../auth-utils");
const { rateLimit } = require("../middleware/rate-limit");
const { SESSION_COOKIE } = require("../middleware/session");

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });

const SESSION_TTL_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const insertUser = db.prepare(
  "INSERT INTO users (name, email, password_hash, joined_at) VALUES (?, ?, ?, date('now'))"
);
const findUserByEmail = db.prepare("SELECT * FROM users WHERE email = ?");
const insertSession = db.prepare(
  `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_TTL_DAYS} days'))`
);
const deleteSession = db.prepare("DELETE FROM sessions WHERE token = ?");

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, points: u.points, totalSpent: u.total_spent, joinedAt: u.joined_at };
}

function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

router.post("/register", authLimiter, (req, res) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Podaj imię i nazwisko." });
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) return res.status(400).json({ error: "Podaj poprawny adres e-mail." });
  if (typeof password !== "string" || password.length < 6) return res.status(400).json({ error: "Hasło musi mieć co najmniej 6 znaków." });

  const cleanEmail = email.trim().toLowerCase();
  if (findUserByEmail.get(cleanEmail)) return res.status(409).json({ error: "Konto z tym adresem e-mail już istnieje." });

  const passwordHash = hashPassword(password);
  const { lastInsertRowid } = insertUser.run(name.trim().slice(0, 120), cleanEmail, passwordHash);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(lastInsertRowid);

  const token = generateToken();
  insertSession.run(token, user.id);
  setSessionCookie(res, token);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/login", authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Podaj e-mail i hasło." });
  }
  const user = findUserByEmail.get(email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Nieprawidłowy e-mail lub hasło." });
  }
  const token = generateToken();
  insertSession.run(token, user.id);
  setSessionCookie(res, token);
  res.json({ user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  if (req.sessionToken) deleteSession.run(req.sessionToken);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

module.exports = { router, publicUser };
