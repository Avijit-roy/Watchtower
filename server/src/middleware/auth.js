/**
 * auth.js — JWT authentication middleware
 *
 * Two exported functions:
 *   requireAuth  — verifies the JWT; blocks unauthenticated requests
 *   requireRole  — must be used AFTER requireAuth; blocks users whose role
 *                  isn't in the allowed list
 *
 * Why middleware rather than checking in every controller?
 * It keeps auth logic in one place. A controller that needs auth just
 * adds `requireAuth` to the route — it doesn't repeat the token-checking logic.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify the Bearer token in the Authorization header.
 * On success: attaches req.user (the full Mongoose document) and calls next().
 * On failure: returns 401 { error: string }.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB so we always have the latest role — a cached payload
    // could be stale if an admin changed the user's role after they logged in.
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please log in again.' });
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
}

/**
 * Factory that returns a middleware checking whether req.user.role is in the allowed list.
 * Must be called AFTER requireAuth (so req.user is populated).
 *
 * Usage: router.post('/incidents', requireAuth, requireRole('responder', 'admin'), controller)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // Defensive: this shouldn't happen if requireRole follows requireAuth
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Your role (${req.user.role}) does not have permission to perform this action.`,
      });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole };
