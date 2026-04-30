

// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const jwt = require('jsonwebtoken');
// const Hotel = require('../models/Hotel');

// // ✅ Middleware vérification token
// const verifyToken = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ error: 'Token manquant' });
//   try {
//     req.user = jwt.verify(token, process.env.JWT_SECRET);
//     next();
//   } catch {
//     res.status(401).json({ error: 'Token invalide' });
//   }
// };

// // ✅ Config Multer
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) cb(null, true);
//     else cb(new Error('Fichier non supporté'));
//   }
// });

// // ✅ GET — hôtels de l'utilisateur connecté AVEC pagination
// router.get('/', verifyToken, async (req, res) => {
//   try {
//     const page  = parseInt(req.query.page)  || 1;
//     const limit = parseInt(req.query.limit) || 8;
//     const skip  = (page - 1) * limit;

//     const [hotels, total] = await Promise.all([
//       Hotel.find({ userId: req.user.id })
//            .sort({ createdAt: -1 })
//            .skip(skip)
//            .limit(limit),
//       Hotel.countDocuments({ userId: req.user.id })
//     ]);

//     res.json({
//       hotels,
//       total,
//       page,
//       totalPages: Math.ceil(total / limit)
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ GET — un hôtel par ID
// router.get('/:id', verifyToken, async (req, res) => {
//   try {
//     const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.user.id });
//     if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable' });
//     res.json(hotel);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ POST — créer un hôtel
// router.post('/', verifyToken, upload.single('image'), async (req, res) => {
//   try {
//     const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
//     const hotel = new Hotel({
//       ...req.body,
//       userId: req.user.id,
//       image: imageUrl,
//     });
//     await hotel.save();
//     res.status(201).json({ message: 'Hôtel créé ✅', hotel });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // ✅ PUT — modifier un hôtel
// router.put('/:id', verifyToken, async (req, res) => {
//   try {
//     const hotel = await Hotel.findOneAndUpdate(
//       { _id: req.params.id, userId: req.user.id },
//       { $set: req.body },
//       { new: true, runValidators: true }
//     );
//     if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable ou non autorisé' });
//     res.json({ message: 'Hôtel modifié ✅', hotel });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // ✅ DELETE — supprimer un hôtel
// router.delete('/:id', verifyToken, async (req, res) => {
//   try {
//     const hotel = await Hotel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
//     if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable ou non autorisé' });
//     res.json({ message: 'Hôtel supprimé ✅' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;




const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Hotel = require('../models/Hotel');

// ✅ Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Config Multer + Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'red-product/hotels',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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

// ✅ GET — hôtels avec pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip  = (page - 1) * limit;

    const [hotels, total] = await Promise.all([
      Hotel.find({ userId: req.user.id })
           .sort({ createdAt: -1 })
           .skip(skip)
           .limit(limit),
      Hotel.countDocuments({ userId: req.user.id })
    ]);

    res.json({ hotels, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET — un hôtel par ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.user.id });
    if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable' });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST — créer un hôtel avec image Cloudinary
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    // L'image est maintenant une URL Cloudinary permanente
    const imageUrl = req.file ? req.file.path : null;
    const hotel = new Hotel({
      ...req.body,
      userId: req.user.id,
      image: imageUrl,
    });
    await hotel.save();
    res.status(201).json({ message: 'Hôtel créé ✅', hotel });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ PUT — modifier un hôtel
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable ou non autorisé' });
    res.json({ message: 'Hôtel modifié ✅', hotel });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE — supprimer un hôtel
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!hotel) return res.status(404).json({ error: 'Hôtel introuvable ou non autorisé' });

    // Supprimer l'image de Cloudinary si elle existe
    if (hotel.image && hotel.image.includes('cloudinary')) {
      const publicId = hotel.image.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    res.json({ message: 'Hôtel supprimé ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;