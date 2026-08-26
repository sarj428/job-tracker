const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { registerRules, loginRules, validate } = require('../validators/jobValidator');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', auth, getMe);

module.exports = router;
