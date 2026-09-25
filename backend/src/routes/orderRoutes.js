const express = require('express');
const router = express.Router({ strict: true });
const {
  createOrder,
  createGuestOrder,
  getOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  getMyOrders,
  cancelOrder,
  sendThankYouMessage,
  verifyPayment,
  markSentMoney,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/guest', createGuestOrder);
router.get('/track', trackOrder);
router.post('/:id/verify-payment', protect, admin, verifyPayment);
router.post('/:id/mark-sent-money', markSentMoney);

router.route('/')
  .post(createOrder)
  .get(protect, admin, getOrders);

router.route('/my-orders')
  .get(protect, getMyOrders);

router.route('/:id')
  .get(getOrderById);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

router.route('/:id/send-thank-you')
  .post(protect, admin, sendThankYouMessage);

module.exports = router;

