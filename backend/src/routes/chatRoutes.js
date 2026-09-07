const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  getConversations,
  deleteConversation,
  deleteSingleMessage,
} = require('../controllers/chatController');

router.use(protect);

router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/messages/:userId?', getMessages);
router.delete('/conversations/:userId?', deleteConversation);
router.delete('/messages/:messageId', deleteSingleMessage);

module.exports = router;
