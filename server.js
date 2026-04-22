const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// ✅ Servir les images uploadées
app.use('/uploads', express.static('uploads'));

// ✅ Servir les fichiers HTML du frontend
app.use(express.static('../red-product-web'));


// ✅ Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté !'))
  .catch(err => console.error('❌ Mongo error:', err.message));


// ✅ Auth route
app.use('/api/auth', require('./src/routes/auth'));

// ✅ Hotels route
app.use('/api/hotels', require('./src/routes/hotel'));

// ✅ Stats route
app.use('/api/stats', require('./src/routes/stats'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));