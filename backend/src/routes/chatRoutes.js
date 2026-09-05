const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  getConversations,
} = require('../controllers/chatController');

router.use(protect);

router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/messages/:userId?', getMessages);

module.exports = router;
