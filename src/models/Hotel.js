const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ← lié à l'utilisateur
  nom:         { type: String, required: true },
  email:       { type: String, required: true },
  prix:        { type: String, required: true },
  adresse:     { type: String, required: true },
  numero:      { type: String, required: true },
  devise:      { type: String, default: 'XOF' },
  description: { type: String, default: '' },
  image:       { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);