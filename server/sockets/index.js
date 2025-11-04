import Message from '../models/Message.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const onlineUsers = new Map();
const typingUsers = new Map();

export const handleSocketConnection = (io, socket) => {
  console.log('User connected:', socket.username);

  onlineUsers.set(socket.userId.toString(), socket.id);

  User.findByIdAndUpdate(socket.userId, {
    status: 'online',
    lastSeen: new Date()
  }).then(() => {
    io.emit('user-status-change', {
      userId: socket.userId,
      status: 'online',
      username: socket.username
    });
  });

  socket.emit('online-users', Array.from(onlineUsers.keys()));

  socket.on('join-room', async (room) => {
    socket.join(room);
    socket.currentRoom = room;

    const roomDoc = await Room.findOne({ name: room });
    if (roomDoc && !roomDoc.members.includes(socket.userId)) {
      roomDoc.members.push(socket.userId);
      await roomDoc.save();
    }

    io.to(room).emit('user-joined', {
      userId: socket.userId,
      username: socket.username,
      room
    });
  });

  socket.on('leave-room', async (room) => {
    socket.leave(room);
    io.to(room).emit('user-left', {
      userId: socket.userId,
      username: socket.username,
      room
    });
  });

  socket.on('send-message', async (data) => {
    try {
      const message = new Message({
        sender: socket.userId,
        content: data.content,
        room: data.room || 'global',
        isPrivate: false
      });

      await message.save();
      await message.populate('sender', 'username avatar');

      io.to(data.room || 'global').emit('new-message', {
        ...message.toObject(),
        timestamp: message.createdAt
      });

      const roomSockets = await io.in(data.room || 'global').fetchSockets();
      roomSockets.forEach(s => {
        if (s.userId.toString() !== socket.userId.toString()) {
          s.emit('notification', {
            type: 'new-message',
            message: `${socket.username}: ${data.content.substring(0, 50)}`,
            from: socket.username,
            room: data.room || 'global'
          });
        }
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('send-private-message', async (data) => {
    try {
      const message = new Message({
        sender: socket.userId,
        content: data.content,
        recipient: data.recipientId,
        isPrivate: true
      });

      await message.save();
      await message.populate(['sender', 'recipient'], 'username avatar');

      const recipientSocketId = onlineUsers.get(data.recipientId);

      socket.emit('new-private-message', message.toObject());

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new-private-message', message.toObject());
        io.to(recipientSocketId).emit('notification', {
          type: 'private-message',
          message: `${socket.username}: ${data.content.substring(0, 50)}`,
          from: socket.username,
          fromId: socket.userId
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });

  socket.on('typing-start', (data) => {
    const key = data.recipientId ? `private-${data.recipientId}` : data.room;
    if (!typingUsers.has(key)) {
      typingUsers.set(key, new Set());
    }
    typingUsers.get(key).add(socket.userId.toString());

    if (data.recipientId) {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user-typing', {
          userId: socket.userId,
          username: socket.username,
          isPrivate: true
        });
      }
    } else {
      socket.to(data.room).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        room: data.room
      });
    }
  });

  socket.on('typing-stop', (data) => {
    const key = data.recipientId ? `private-${data.recipientId}` : data.room;
    if (typingUsers.has(key)) {
      typingUsers.get(key).delete(socket.userId.toString());
    }

    if (data.recipientId) {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user-stopped-typing', {
          userId: socket.userId
        });
      }
    } else {
      socket.to(data.room).emit('user-stopped-typing', {
        userId: socket.userId,
        room: data.room
      });
    }
  });

  socket.on('add-reaction', async (data) => {
    try {
      const message = await Message.findById(data.messageId);
      if (!message) return;

      const existingReaction = message.reactions.find(
        r => r.user.equals(socket.userId) && r.type === data.reactionType
      );

      if (existingReaction) {
        message.reactions = message.reactions.filter(
          r => !(r.user.equals(socket.userId) && r.type === data.reactionType)
        );
      } else {
        message.reactions.push({
          user: socket.userId,
          type: data.reactionType
        });
      }

      await message.save();
      await message.populate('reactions.user', 'username');

      const room = message.isPrivate ? null : message.room;
      if (room) {
        io.to(room).emit('reaction-updated', {
          messageId: data.messageId,
          reactions: message.reactions
        });
      } else {
        const recipientId = message.sender.equals(socket.userId)
          ? message.recipient
          : message.sender;
        const recipientSocketId = onlineUsers.get(recipientId.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('reaction-updated', {
            messageId: data.messageId,
            reactions: message.reactions
          });
        }
        socket.emit('reaction-updated', {
          messageId: data.messageId,
          reactions: message.reactions
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  socket.on('message-read', async (data) => {
    try {
      const message = await Message.findById(data.messageId);
      if (!message) return;

      const alreadyRead = message.readBy.some(read => read.user.equals(socket.userId));
      if (!alreadyRead) {
        message.readBy.push({ user: socket.userId });
        await message.save();

        const senderSocketId = onlineUsers.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-read-receipt', {
            messageId: data.messageId,
            readBy: socket.userId,
            username: socket.username
          });
        }
      }
    } catch (error) {
      console.error('Message read error:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.username);
    onlineUsers.delete(socket.userId.toString());

    try {
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      io.emit('user-status-change', {
        userId: socket.userId,
        status: 'offline',
        username: socket.username,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });
};
