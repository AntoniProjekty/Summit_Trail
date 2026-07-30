const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/session");

const router = express.Router();
router.use(requireAuth);

// Kept in sync with the PROMOS map in the storefront frontend (docs/05, checkout logic).
const PROMOS = { SZLAK10: 0.1, WITAMY5: 0.05 };
const MAX_SHIP_COST = 500;

const listCart = db.prepare("SELECT * FROM cart_items WHERE user_id = ?");
const clearCart = db.prepare("DELETE FROM cart_items WHERE user_id = ?");
const insertOrder = db.prepare(`
  INSERT INTO orders (user_id, number, created_at, subtotal, discount, ship_cost, total, points, delivery, payment)
  VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
`);
const insertOrderItem = db.prepare(
  "INSERT INTO order_items (order_id, name, variant, qty, unit_price) VALUES (?, ?, ?, ?, ?)"
);
const bumpUser = db.prepare("UPDATE users SET points = points + ?, total_spent = total_spent + ? WHERE id = ?");
const listOrders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC");
const listOrderItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?");

function genOrderNumber() {
  return "SNT-" + Math.floor(100000 + Math.random() * 899999);
}

router.post("/checkout", (req, res) => {
  const cartRows = listCart.all(req.user.id);
  if (cartRows.length === 0) return res.status(400).json({ error: "Koszyk jest pusty." });

  const { promoCode, delivery, payment } = req.body || {};
  let shipCost = Number(req.body && req.body.shipCost);
  if (!Number.isFinite(shipCost) || shipCost < 0) shipCost = 0;
  shipCost = Math.min(shipCost, MAX_SHIP_COST);

  const subtotal = cartRows.reduce((sum, r) => sum + r.unit_price * r.qty, 0);

  let discount = 0;
  let appliedPromo = null;
  if (promoCode) {
    const pct = PROMOS[String(promoCode).trim().toUpperCase()];
    if (!pct) return res.status(400).json({ error: "Nieprawidłowy kod rabatowy." });
    discount = Math.round(subtotal * pct);
    appliedPromo = String(promoCode).trim().toUpperCase();
  }

  const total = Math.max(0, subtotal - discount + shipCost);
  const points = Math.floor(total / 10);
  const number = genOrderNumber();

  db.exec("BEGIN");
  try {
    const { lastInsertRowid: orderId } = insertOrder.run(
      req.user.id, number, subtotal, discount, shipCost, total, points,
      typeof delivery === "string" ? delivery.slice(0, 120) : null,
      typeof payment === "string" ? payment.slice(0, 40) : null
    );
    for (const item of cartRows) {
      insertOrderItem.run(orderId, item.product_name, item.variant_label, item.qty, item.unit_price);
    }
    bumpUser.run(points, subtotal - discount, req.user.id);
    clearCart.run(req.user.id);
    db.exec("COMMIT");

    res.status(201).json({
      order: { number, subtotal, discount, promo: appliedPromo, shipCost, total, points, delivery, payment },
    });
  } catch (err) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: "Nie udało się złożyć zamówienia." });
  }
});

router.get("/", (req, res) => {
  const orders = listOrders.all(req.user.id).map((o) => ({
    number: o.number,
    date: o.created_at.slice(0, 10),
    subtotal: o.subtotal,
    discount: o.discount,
    shipCost: o.ship_cost,
    total: o.total,
    points: o.points,
    delivery: o.delivery,
    payment: o.payment,
    items: listOrderItems.all(o.id).map((i) => ({ name: i.name, variant: i.variant, qty: i.qty, unitPrice: i.unit_price })),
  }));
  res.json({ orders });
});

module.exports = router;
