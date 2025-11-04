import express from 'express';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/room/:room', authenticateToken, async (req, res) => {
  try {
    const { room } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ room, isPrivate: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .populate('reactions.user', 'username');

    const total = await Message.countDocuments({ room, isPrivate: false });

    res.json({
      messages: messages.reverse(),
      hasMore: page * limit < total,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/private/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      isPrivate: true,
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar')
      .populate('reactions.user', 'username');

    const total = await Message.countDocuments({
      isPrivate: true,
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    });

    res.json({
      messages: messages.reverse(),
      hasMore: page * limit < total,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, room = 'global' } = req.query;

    const messages = await Message.find({
      room,
      isPrivate: false,
      content: { $regex: query, $options: 'i' }
    })
      .limit(20)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const alreadyRead = message.readBy.some(read => read.user.equals(userId));
    if (!alreadyRead) {
      message.readBy.push({ user: userId });
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
