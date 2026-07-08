/**
 * authController.js — register, login, and get-current-user
 *
 * All validation uses express-validator so errors are consistent and
 * collected before any DB call is made.
 */
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Helper: sign a JWT with the user's ID as the subject claim
function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Helper: collect express-validator errors and return early if any exist
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return only the first error message — keeps the response clean
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  return null;
}

// ---------- Validation rule chains (exported so routes can apply them) ----------

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['responder', 'admin', 'readonly'])
    .withMessage('Role must be responder, admin, or readonly'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ---------- Controllers ---------------------------------------------------------

/**
 * POST /api/auth/register
 * Creates a new user. The password is passed as `passwordHash` field because
 * the User schema's pre-save hook expects to hash whatever is in that field.
 */
async function register(req, res) {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return; // response already sent

  const { name, email, password, role } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password, // the pre-save hook will hash this
      role: role || 'responder',
    });

    const token = signToken(user._id);

    return res.status(201).json({
      token,
      user: user.toJSON(), // toJSON() strips passwordHash
    });
  } catch (err) {
    console.error('[authController.register]', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

/**
 * POST /api/auth/login
 * Validates email/password and returns a JWT on success.
 */
async function login(req, res) {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  const { email, password } = req.body;

  try {
    // .select('+passwordHash') is required because the schema hides it by default
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      // Use the same message for wrong email and wrong password — prevents user enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[authController.login]', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (from req.user set by requireAuth middleware).
 */
function getMe(req, res) {
  return res.status(200).json({ user: req.user.toJSON() });
}

module.exports = {
  register,
  registerValidation,
  login,
  loginValidation,
  getMe,
};
