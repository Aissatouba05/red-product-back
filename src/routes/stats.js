const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hotel = require('../models/Hotel');

// ✅ Middleware vérification token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ✅ GET /api/stats — stats de l'utilisateur connecté
router.get('/', verifyToken, async (req, res) => {
  try {
    const [totalHotels, totalUtilisateurs] = await Promise.all([
      Hotel.countDocuments({ userId: req.user.id }), // ← hôtels de cet utilisateur
      User.countDocuments(),                          // ← total utilisateurs (admin info)
    ]);

    res.json({
      formulaires:  0,              // à brancher plus tard
      messages:     0,              // à brancher plus tard
      emails:       0,              // à brancher plus tard
      utilisateurs: totalUtilisateurs,
      hotels:       totalHotels,    // ← hôtels de CET utilisateur
      entites:      2,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;