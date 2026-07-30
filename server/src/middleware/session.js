const db = require("../db");

const SESSION_COOKIE = "stt_session";

const getSessionUser = db.prepare(`
  SELECT users.* FROM sessions
  JOIN users ON users.id = sessions.user_id
  WHERE sessions.token = ? AND sessions.expires_at > datetime('now')
`);

// Attaches req.user (or null) based on the session cookie. Never rejects by itself —
// individual routes decide whether they require a logged-in user.
function attachUser(req, res, next) {
  const token = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  req.sessionToken = token || null;
  req.user = token ? getSessionUser.get(token) || null : null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Musisz być zalogowany." });
  next();
}

module.exports = { attachUser, requireAuth, SESSION_COOKIE };
