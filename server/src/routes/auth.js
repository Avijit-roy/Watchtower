const { Router } = require('express');
const {
  register, registerValidation,
  login, loginValidation,
  getMe,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/me — requires a valid JWT
router.get('/me', requireAuth, getMe);

module.exports = router;
