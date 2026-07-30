const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { attachUser } = require("./middleware/session");
const { router: authRouter } = require("./routes/auth");
const cartRouter = require("./routes/cart");
const wishlistRouter = require("./routes/wishlist");
const ordersRouter = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/non-browser requests (no Origin header) and configured origins.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(attachUser);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.get("/api/health", (req, res) => res.json({ ok: true, service: "summit-trail-api" }));

app.use("/api/auth", authRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/orders", ordersRouter);

app.use((req, res) => res.status(404).json({ error: "Nie znaleziono." }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  console.error(err);
  res.status(500).json({ error: "Wewnętrzny błąd serwera." });
});

app.listen(PORT, () => {
  console.log(`Summit & Trail API listening on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
