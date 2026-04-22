const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
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

// ✅ Config Multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Fichier non supporté'));
  }
});

// ✅ GET — hôtels de l'utilisateur connecté uniquement
router.get('/', verifyToken, async (req, res) => {
  try {
    const hotels = await Hotel.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET — un hôtel par ID (vérifie que c'est bien le bon utilisateur)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.user.id });
    if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable' });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST — créer un hôtel lié à l'utilisateur connecté
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const hotel = new Hotel({
      ...req.body,
      userId: req.user.id, // ← lié à l'utilisateur connecté
      image: imageUrl,
    });
    await hotel.save();
    res.status(201).json({ message: 'Hôtel créé ✅', hotel });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ PUT — modifier un hôtel (seulement si c'est le bon utilisateur)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // ← vérifie le propriétaire
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable ou non autorisé' });
    res.json({ message: 'Hôtel modifié ✅', hotel });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE — supprimer un hôtel (seulement si c'est le bon utilisateur)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable ou non autorisé' });
    res.json({ message: 'Hôtel supprimé ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;