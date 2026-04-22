// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   email: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   resetToken: String,
//   resetTokenExpiry: Date
// });

// // ← HOOK CORRIGÉ (sans next)
// userSchema.pre('save', async function() {
//   if (!this.isModified('password')) return;
//   this.password = await bcrypt.hash(this.password, 12);
// });

// module.exports = mongoose.model('User', userSchema);

// // models/User.js

// const User = mongoose.model("User", userSchema);
// module.exports = User;


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom:      { type: String, required: true }, // ← ajouté
  email:    { type: String, unique: true, required: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiry: Date
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model('User', userSchema);