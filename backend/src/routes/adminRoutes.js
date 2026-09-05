const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// Require login & admin role for all routes in this file
router.use(protect, admin);

router.get('/stats', getStats);

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
