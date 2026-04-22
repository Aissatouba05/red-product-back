

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const router = express.Router();



router.get('/moi', (req, res) => {
  res.json({ message: "Route moi fonctionne" });
});

module.exports = router;

module.exports = router;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, nom } = req.body; // ← ajouté nom
    const user = new User({ email, password, nom }); // ← ajouté nom
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, email, nom } }); // ← ajouté nom
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, email, nom: user.nom } }); // ← ajouté nom
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const mailOptions = {
      to: email,
      subject: 'RedProduct - Reset Password',
      // text: `Clique: http://localhost:3000/reset-password/${token}`
      // : `textClique: http://localhost:5000/new-password.html?token=$token{}`
      text: `Clique: ${process.env.FRONTEND_URL}/new-password.html?token=${token}`
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email envoyé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Token invalide/expiré' });

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Déconnexion
exports.deconnecter = async (req, res) => {
  try {
    res.status(200).json({
      succes: true,
      message: 'Déconnexion réussie'
    });
  } catch (erreur) {
    res.status(500).json({
      succes: false,
      message: erreur.message
    });
  }
};
// ← AJOUTÉ : Middleware vérification token
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

// ← AJOUTÉ : Route /me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


