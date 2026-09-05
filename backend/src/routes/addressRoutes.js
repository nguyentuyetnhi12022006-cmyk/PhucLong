const express = require('express');
const router = express.Router();
const {
  getAddresses,
  createAddress,
  deleteAddress,
} = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

// All routes require login
router.use(protect);

router.route('/')
  .get(getAddresses)
  .post(createAddress);

router.route('/:id')
  .delete(deleteAddress);

module.exports = router;
