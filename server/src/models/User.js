/**
 * User.js — Mongoose schema for authenticated users
 *
 * Why bcryptjs in the pre-save hook?
 * Passwords must never be stored as plain text. bcryptjs hashes them
 * with a salt so that even if the DB leaks, passwords can't be reversed.
 * We store `passwordHash`, never the raw password.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default — must be explicitly requested
    },
    role: {
      type: String,
      enum: {
        values: ['responder', 'admin', 'readonly'],
        message: 'Role must be responder, admin, or readonly',
      },
      default: 'responder',
    },
  },
  { timestamps: true }
);

// Hash the password before saving whenever it changes.
// We check isModified so re-saving an existing user doesn't re-hash an already-hashed value.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Instance method: compare a plaintext candidate against the stored hash.
// Called during login — never exposes the hash itself.
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Remove passwordHash from any JSON representation (e.g., when we send the user object to the client).
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
