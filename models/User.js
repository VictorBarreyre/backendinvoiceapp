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
  console.log('Password before hash in middleware:', this.password);
  if (!this.isModified('password')) return next();
  try {
    this.password = await argon2.hash(this.password);
    console.log('Password after hash in middleware:', this.password);
    next();
  } catch (error) {
    next(error); // Transmet l'erreur au middleware suivant ou lève une exception si aucune gestion d'erreur n'est définie.
  }
});


userSchema.methods.comparePassword = async function(candidatePassword) {
  return await argon2.verify(this.password, candidatePassword);
};


const User = mongoose.model('User', userSchema);

module.exports = User;