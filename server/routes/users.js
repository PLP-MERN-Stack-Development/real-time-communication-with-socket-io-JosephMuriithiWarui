import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar status lastSeen')
      .sort({ username: 1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:userId/unread', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const unreadCount = await Message.countDocuments({
      sender: userId,
      recipient: currentUserId,
      isPrivate: true,
      'readBy.user': { $ne: currentUserId }
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
