const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/session");

const router = express.Router();
router.use(requireAuth);

const listWishlist = db.prepare("SELECT product_id FROM wishlist_items WHERE user_id = ?");
const addItem = db.prepare("INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)");
const removeItem = db.prepare("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?");

router.get("/", (req, res) => {
  res.json({ productIds: listWishlist.all(req.user.id).map((r) => r.product_id) });
});

router.post("/:productId", (req, res) => {
  addItem.run(req.user.id, req.params.productId);
  res.status(201).json({ productIds: listWishlist.all(req.user.id).map((r) => r.product_id) });
});

router.delete("/:productId", (req, res) => {
  removeItem.run(req.user.id, req.params.productId);
  res.json({ productIds: listWishlist.all(req.user.id).map((r) => r.product_id) });
});

module.exports = router;
