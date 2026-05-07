
// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');
// const multer = require('multer');
// const User = require('../models/User');
// const BlacklistToken = require('../models/BlacklistToken');
// const router = express.Router();

// // ✅ Config Cloudinary
// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key:    process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // ✅ Config Multer + Cloudinary pour les photos de profil
// const profileStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'red-product/profiles',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
//   },
// });
// const uploadPhoto = multer({ storage: profileStorage, limits: { fileSize: 2 * 1024 * 1024 } });

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
// });

// // ✅ Middleware vérification token + blacklist
// const verifyToken = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ error: 'Token manquant' });
//   try {
//     const blacklisted = await BlacklistToken.findOne({ token });
//     if (blacklisted) return res.status(401).json({ error: 'Token invalide, veuillez vous reconnecter' });
//     req.user = jwt.verify(token, process.env.JWT_SECRET);
//     next();
//   } catch {
//     res.status(401).json({ error: 'Token invalide' });
//   }
// };

// // ✅ Register — avec activation par email
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password, nom } = req.body;

//     // Vérifier si email déjà utilisé
//     const existing = await User.findOne({ email });
//     if (existing) return res.status(400).json({ error: 'Cet email est déjà utilisé.' });

//     // Générer token d'activation
//     const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });

//     const user = new User({
//       email, password, nom,
//       isActive: false,
//       activationToken,
//       activationExpiry: Date.now() + 24 * 3600000 // 24h
//     });
//     await user.save();

//     // Envoyer email d'activation
//     const activationLink = `${process.env.FRONTEND_URL}/activation.html?token=${activationToken}`;
//     await transporter.sendMail({
//       to: email,
//       subject: 'RED PRODUCT — Activez votre compte',
//       html: `
//         <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
//           <h2 style="color: #333">Bienvenue sur RED PRODUCT, ${nom} !</h2>
//           <p>Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
//           <a href="${activationLink}"
//             style="display:inline-block; background:#333; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:12px;">
//             Activer mon compte
//           </a>
//           <p style="color:#999; font-size:12px; margin-top:16px;">Ce lien expire dans 24 heures.</p>
//         </div>
//       `
//     });

//     res.json({ message: 'Inscription réussie ! Vérifiez votre email pour activer votre compte.' });
//   } catch (err) { res.status(400).json({ error: err.message }); }
// });

// // ✅ Login — vérifie l'activation
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user || !await bcrypt.compare(password, user.password)) {
//       return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
//     }
//     // Vérifier si le compte est activé
//     if (!user.isActive) {
//       return res.status(403).json({ error: 'Compte non activé. Vérifiez votre email.' });
//     }
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
//     res.json({ token, user: { id: user._id, email, nom: user.nom } });
//   } catch (err) { res.status(400).json({ error: err.message }); }
// });

// // ✅ Déconnexion
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

// // ✅ GET /me
// router.get('/me', verifyToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ PUT — changer la photo de profil
// router.put('/photo', verifyToken, uploadPhoto.single('photo'), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: 'Aucune image fournie' });
//     const photoUrl = req.file.path;
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

// // ✅ PUT — modifier le profil (nom, email, mot de passe)
// router.put('/profil', verifyToken, async (req, res) => {
//   try {
//     const { nom, email, password } = req.body;
//     const updateData = {};

//     if (nom) updateData.nom = nom;
//     if (email) updateData.email = email;

//     if (password && password.length >= 6) {
//       updateData.password = await bcrypt.hash(password, 12);
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { $set: updateData },
//       { new: true }
//     ).select('-password');

//     if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

//     res.json({ message: 'Profil mis à jour ✅', user });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ GET — activer le compte
// router.get('/activate', async (req, res) => {
//   try {
//     const { token } = req.query;
//     if (!token) return res.status(400).json({ error: 'Token manquant' });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findOne({
//       email: decoded.email,
//       activationToken: token,
//       activationExpiry: { $gt: Date.now() }
//     });

//     if (!user) return res.status(400).json({ error: 'Lien invalide ou expiré.' });

//     user.isActive = true;
//     user.activationToken = undefined;
//     user.activationExpiry = undefined;
//     await user.save();

//     res.json({ message: 'Compte activé avec succès ✅' });
//   } catch (err) {
//     res.status(400).json({ error: 'Lien invalide ou expiré.' });
//   }
// });

// // ✅ POST — renvoyer email d'activation
// router.post('/resend-activation', async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email, isActive: false });
//     if (!user) return res.status(404).json({ error: 'Compte introuvable ou déjà activé.' });

//     const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
//     user.activationToken  = activationToken;
//     user.activationExpiry = Date.now() + 24 * 3600000;
//     await user.save();

//     const activationLink = `${process.env.FRONTEND_URL}/activation.html?token=${activationToken}`;
//     await transporter.sendMail({
//       to: email,
//       subject: 'RED PRODUCT — Activez votre compte',
//       html: `
//         <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
//           <h2 style="color: #333">Activation de votre compte RED PRODUCT</h2>
//           <p>Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
//           <a href="${activationLink}"
//             style="display:inline-block; background:#333; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:12px;">
//             Activer mon compte
//           </a>
//           <p style="color:#999; font-size:12px; margin-top:16px;">Ce lien expire dans 24 heures.</p>
//         </div>
//       `
//     });

//     res.json({ message: 'Email de confirmation renvoyé ✅' });
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
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS
  }
});

// ✅ Middleware vérification token + blacklist
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    const blacklisted = await BlacklistToken.findOne({ token });
    if (blacklisted) return res.status(401).json({ error: 'Token invalide, veuillez vous reconnecter' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ✅ Register — avec activation par email
router.post('/register', async (req, res) => {
  try {
    const { email, password, nom } = req.body;

    // Vérifier si email déjà utilisé
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Cet email est déjà utilisé.' });

    // Générer token d'activation
    const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    const user = new User({
      email, password, nom,
      isActive: false,
      activationToken,
      activationExpiry: Date.now() + 24 * 3600000 // 24h
    });
    await user.save();

    // Envoyer email d'activation
    const activationLink = `${process.env.FRONTEND_URL}/activation.html?token=${activationToken}`;
    await transporter.sendMail({
      from: `RED PRODUCT <${process.env.BREVO_SMTP_USER}>`,
      to: email,
      subject: 'RED PRODUCT — Activez votre compte',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #333">Bienvenue sur RED PRODUCT, ${nom} !</h2>
          <p>Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
          <a href="${activationLink}"
            style="display:inline-block; background:#333; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:12px;">
            Activer mon compte
          </a>
          <p style="color:#999; font-size:12px; margin-top:16px;">Ce lien expire dans 24 heures.</p>
        </div>
      `
    });

    res.json({ message: 'Inscription réussie ! Vérifiez votre email pour activer votre compte.' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ✅ Login — vérifie l'activation
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    // Vérifier si le compte est activé
    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte non activé. Vérifiez votre email.' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email, nom: user.nom } });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ✅ Déconnexion
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
    mailOptions.from = `RED PRODUCT <${process.env.BREVO_SMTP_USER}>`;
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

// ✅ GET /me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT — changer la photo de profil
router.put('/photo', verifyToken, uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucune image fournie' });
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

// ✅ PUT — modifier le profil (nom, email, mot de passe)
router.put('/profil', verifyToken, async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const updateData = {};

    if (nom) updateData.nom = nom;
    if (email) updateData.email = email;

    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    res.json({ message: 'Profil mis à jour ✅', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET — activer le compte
router.get('/activate', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token manquant' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      email: decoded.email,
      activationToken: token,
      activationExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Lien invalide ou expiré.' });

    user.isActive = true;
    user.activationToken = undefined;
    user.activationExpiry = undefined;
    await user.save();

    res.json({ message: 'Compte activé avec succès ✅' });
  } catch (err) {
    res.status(400).json({ error: 'Lien invalide ou expiré.' });
  }
});

// ✅ POST — renvoyer email d'activation
router.post('/resend-activation', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isActive: false });
    if (!user) return res.status(404).json({ error: 'Compte introuvable ou déjà activé.' });

    const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    user.activationToken  = activationToken;
    user.activationExpiry = Date.now() + 24 * 3600000;
    await user.save();

    const activationLink = `${process.env.FRONTEND_URL}/activation.html?token=${activationToken}`;
    await transporter.sendMail({
      from: `RED PRODUCT <${process.env.BREVO_SMTP_USER}>`,
      to: email,
      subject: 'RED PRODUCT — Activez votre compte',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #333">Activation de votre compte RED PRODUCT</h2>
          <p>Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
          <a href="${activationLink}"
            style="display:inline-block; background:#333; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:12px;">
            Activer mon compte
          </a>
          <p style="color:#999; font-size:12px; margin-top:16px;">Ce lien expire dans 24 heures.</p>
        </div>
      `
    });

    res.json({ message: 'Email de confirmation renvoyé ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, verifyToken };