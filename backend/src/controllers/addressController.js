const Address = require('../models/Address');

// @desc    Get user's saved addresses
// @route   GET /api/addresses
// @access  Private
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, count: addresses.length, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
const createAddress = async (req, res) => {
  const { recipientName, phone, addressLine, isDefault } = req.body;

  if (!recipientName || !phone || !addressLine) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên, SĐT và địa chỉ.' });
  }

  try {
    // If setting as default, unset previous defaults
    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    // Check if user has no existing addresses, if so, make first address default
    const existingCount = await Address.countDocuments({ user: req.user.id });
    const makeDefault = isDefault !== undefined ? isDefault : existingCount === 0;

    const address = await Address.create({
      user: req.user.id,
      recipientName,
      phone,
      addressLine,
      isDefault: makeDefault,
    });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ.' });
    }

    await address.deleteOne();

    // If deleted address was default, set another address as default if exists
    if (address.isDefault) {
      const firstRemaining = await Address.findOne({ user: req.user.id });
      if (firstRemaining) {
        firstRemaining.isDefault = true;
        await firstRemaining.save();
      }
    }

    res.json({ success: true, message: 'Xóa địa chỉ thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAddresses,
  createAddress,
  deleteAddress,
};
