const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/session");

const router = express.Router();
router.use(requireAuth);

const listCart = db.prepare("SELECT * FROM cart_items WHERE user_id = ? ORDER BY id");
const findLine = db.prepare(
  "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND variant_label = ?"
);
const insertLine = db.prepare(
  "INSERT INTO cart_items (user_id, product_id, product_name, variant_label, unit_price, qty) VALUES (?, ?, ?, ?, ?, ?)"
);
const incrementLine = db.prepare("UPDATE cart_items SET qty = qty + ? WHERE id = ?");
const setQty = db.prepare("UPDATE cart_items SET qty = ? WHERE id = ? AND user_id = ?");
const deleteLine = db.prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?");
const clearCart = db.prepare("DELETE FROM cart_items WHERE user_id = ?");

function serialize(rows) {
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    name: r.product_name,
    variantLabel: r.variant_label,
    unitPrice: r.unit_price,
    qty: r.qty,
  }));
}

router.get("/", (req, res) => {
  res.json({ items: serialize(listCart.all(req.user.id)) });
});

router.post("/", (req, res) => {
  const { productId, name, variantLabel, unitPrice, qty } = req.body || {};
  if (typeof productId !== "string" || !productId) return res.status(400).json({ error: "Brak productId." });
  if (typeof name !== "string" || !name) return res.status(400).json({ error: "Brak nazwy produktu." });
  const price = Number(unitPrice);
  const quantity = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "Nieprawidłowa cena." });

  const label = typeof variantLabel === "string" && variantLabel ? variantLabel : "Wariant standardowy";
  const existing = findLine.get(req.user.id, productId, label);
  if (existing) incrementLine.run(quantity, existing.id);
  else insertLine.run(req.user.id, productId, name.slice(0, 200), label.slice(0, 200), price, quantity);

  res.status(201).json({ items: serialize(listCart.all(req.user.id)) });
});

router.patch("/:id", (req, res) => {
  const qty = parseInt(req.body && req.body.qty, 10);
  if (!Number.isFinite(qty) || qty < 1 || qty > 99) return res.status(400).json({ error: "Nieprawidłowa ilość." });
  const result = setQty.run(qty, req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: "Nie znaleziono pozycji." });
  res.json({ items: serialize(listCart.all(req.user.id)) });
});

router.delete("/:id", (req, res) => {
  deleteLine.run(req.params.id, req.user.id);
  res.json({ items: serialize(listCart.all(req.user.id)) });
});

router.delete("/", (req, res) => {
  clearCart.run(req.user.id);
  res.json({ items: [] });
});

module.exports = router;
