


// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');
// const multer = require('multer');
// const path = require('path');
// const User = require('../models/User');
// const BlacklistToken = require('../models/BlacklistToken');
// const router = express.Router();

// // ✅ Config Multer pour les photos de profil
// const storage = multer.diskStorage({
//   destination: './uploads/profiles/',
//   filename: (req, file, cb) => {
//     cb(null, 'profile_' + Date.now() + path.extname(file.originalname));
//   }
// });
// const uploadPhoto = multer({
//   storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) cb(null, true);
//     else cb(new Error('Fichier non supporté'));
//   }
// });

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
// });

// // ✅ Middleware vérification token + blacklist
// const verifyToken = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ error: 'Token manquant' });
//   try {
//     // Vérifier si le token est blacklisté (déconnecté)
//     const blacklisted = await BlacklistToken.findOne({ token });
//     if (blacklisted) return res.status(401).json({ error: 'Token invalide, veuillez vous reconnecter' });

//     req.user = jwt.verify(token, process.env.JWT_SECRET);
//     next();
//   } catch {
//     res.status(401).json({ error: 'Token invalide' });
//   }
// };

// // ✅ Register
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password, nom } = req.body;
//     const user = new User({ email, password, nom });
//     await user.save();
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
//     res.json({ token, user: { id: user._id, email, nom } });
//   } catch (err) { res.status(400).json({ error: err.message }); }
// });

// // ✅ Login
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user || !await bcrypt.compare(password, user.password)) {
//       return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
//     }
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
//     res.json({ token, user: { id: user._id, email, nom: user.nom } });
//   } catch (err) { res.status(400).json({ error: err.message }); }
// });

// // ✅ Déconnexion — ajoute le token à la blacklist
// router.post('/deconnexion', verifyToken, async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     await BlacklistToken.create({ token });
//     res.json({ message: 'Déconnexion réussie ✅' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ Forgot Password
// router.post('/forgot-password', async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: 'Email introuvable' });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     user.resetToken = token;
//     user.resetTokenExpiry = Date.now() + 3600000;
//     await user.save();

//     const mailOptions = {
//       to: email,
//       subject: 'RedProduct - Reset Password',
//       text: `Cliquez sur ce lien pour réinitialiser votre mot de passe:\n\n${process.env.FRONTEND_URL}/new-password.html?token=${token}`
//     };
//     await transporter.sendMail(mailOptions);
//     res.json({ message: 'Email envoyé ✅' });
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // ✅ Reset Password
// router.post('/reset-password/:token', async (req, res) => {
//   try {
//     const { password } = req.body;
//     const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
//     const user = await User.findOne({ _id: decoded.id, resetTokenExpiry: { $gt: Date.now() } });
//     if (!user) return res.status(400).json({ error: 'Token invalide ou expiré' });

//     user.password = password;
//     user.resetToken = undefined;
//     user.resetTokenExpiry = undefined;
//     await user.save();
//     res.json({ message: 'Mot de passe réinitialisé ✅' });
//   } catch (err) { res.status(400).json({ error: err.message }); }
// });

// // ✅ PUT — changer la photo de profil
// router.put('/photo', verifyToken, uploadPhoto.single('photo'), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: 'Aucune image fournie' });
//     const photoUrl = `/uploads/profiles/${req.file.filename}`;
//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { photo: photoUrl },
//       { new: true }
//     ).select('-password');
//     res.json({ message: 'Photo mise à jour ✅', photo: photoUrl, user });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ GET /me — retourner aussi la photo
// router.get('/me', verifyToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = { router, verifyToken };


const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const User = require('../models/User');
const BlacklistToken = require('../models/BlacklistToken');
const router = express.Router();

// ✅ Config Cloudinary
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Config Multer + Cloudinary pour les photos de profil
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'red-product/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});
const uploadPhoto = multer({ storage: profileStorage, limits: { fileSize: 2 * 1024 * 1024 } });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ✅ Middleware vérification token + blacklist
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    // Vérifier si le token est blacklisté (déconnecté)
    const blacklisted = await BlacklistToken.findOne({ token });
    if (blacklisted) return res.status(401).json({ error: 'Token invalide, veuillez vous reconnecter' });

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ✅ Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, nom } = req.body;
    const user = new User({ email, password, nom });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email, nom } });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ✅ Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email, nom: user.nom } });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ✅ Déconnexion — ajoute le token à la blacklist
router.post('/deconnexion', verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await BlacklistToken.create({ token });
    res.json({ message: 'Déconnexion réussie ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email introuvable' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const mailOptions = {
      to: email,
      subject: 'RedProduct - Reset Password',
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe:\n\n${process.env.FRONTEND_URL}/new-password.html?token=${token}`
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email envoyé ✅' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Token invalide ou expiré' });

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Mot de passe réinitialisé ✅' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ✅ PUT — changer la photo de profil
router.put('/photo', verifyToken, uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucune image fournie' });
    // L'image est maintenant une URL Cloudinary permanente
    const photoUrl = req.file.path;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { photo: photoUrl },
      { new: true }
    ).select('-password');
    res.json({ message: 'Photo mise à jour ✅', photo: photoUrl, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /me — retourner aussi la photo
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, verifyToken };