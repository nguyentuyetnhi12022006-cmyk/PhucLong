const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getActiveCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/auth');

// Public routes for customers
router.get('/active', getActiveCoupons);
router.post('/validate', validateCoupon);

// Admin-only CRUD routes
router.route('/')
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon);

router.route('/:id')
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

module.exports = router;
