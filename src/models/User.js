
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   nom:      { type: String, required: true },
//   email:    { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   photo:    { type: String, default: null }, // ← ajouté pour la photo de profil
//   resetToken: String,
//   resetTokenExpiry: Date
// });

// userSchema.pre('save', async function() {
//   if (!this.isModified('password')) return;
//   this.password = await bcrypt.hash(this.password, 12);
// });

// module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom:      { type: String, required: true },
  email:    { type: String, unique: true, required: true },
  password: { type: String, required: true },
  photo:    { type: String, default: null },
  // ✅ Activation de compte
  isActive:           { type: Boolean, default: false },
  activationToken:    { type: String },
  activationExpiry:   { type: Date },
  resetToken:         String,
  resetTokenExpiry:   Date
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model('User', userSchema);