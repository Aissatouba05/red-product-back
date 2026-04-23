const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' } // ← supprimé automatiquement après 7 jours
});

module.exports = mongoose.model('BlacklistToken', blacklistSchema);