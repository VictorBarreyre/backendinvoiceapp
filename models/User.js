const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  adresse: {
    type: String,
    required: false
  },
  siret: {
    type: String,
    required: false
  },
  iban: {
    type: String,
    required: false
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await argon2.hash(this.password);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await argon2.verify(this.password, candidatePassword);
};


const User = mongoose.model('User', userSchema);

module.exports = User;
