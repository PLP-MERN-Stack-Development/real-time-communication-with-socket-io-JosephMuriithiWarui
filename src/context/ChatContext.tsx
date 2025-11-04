import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
  content: string;
  room?: string;
  recipient?: any;
  isPrivate: boolean;
  createdAt: string;
  reactions: any[];
  readBy: any[];
}

interface OnlineUser {
  _id: string;
  username: string;
  avatar: string;
  status: string;
  lastSeen: string;
}

interface ChatContextType {
  messages: Message[];
  privateMessages: Map<string, Message[]>;
  currentRoom: string;
  setCurrentRoom: (room: string) => void;
  currentPrivateChat: string | null;
  setCurrentPrivateChat: (userId: string | null) => void;
  sendMessage: (content: string) => void;
  sendPrivateMessage: (recipientId: string, content: string) => void;
  onlineUsers: OnlineUser[];
  typingUsers: Set<string>;
  notifications: any[];
  clearNotifications: () => void;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
  searchMessages: (query: string) => Promise<void>;
  searchResults: Message[];
  addReaction: (messageId: string, reactionType: string) => void;
  unreadCounts: Map<string, number>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Map<string, Message[]>>(new Map());
  const [currentRoom, setCurrentRoom] = useState('global');
  const [currentPrivateChat, setCurrentPrivateChat] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!token || !user) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    socket.emit('join-room', currentRoom);

    loadMessages();

    socket.on('new-message', (message: Message) => {
      if (message.room === currentRoom && !message.isPrivate) {
        setMessages(prev => [...prev, message]);
        playNotificationSound();
      }
    });

    socket.on('new-private-message', (message: Message) => {
      const otherUserId = message.sender._id === user.id ? message.recipient._id : message.sender._id;

      setPrivateMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(otherUserId) || [];
        newMap.set(otherUserId, [...existing, message]);
        return newMap;
      });

      if (currentPrivateChat !== otherUserId) {
        setUnreadCounts(prev => {
          const newMap = new Map(prev);
          newMap.set(otherUserId, (newMap.get(otherUserId) || 0) + 1);
          return newMap;
        });
      }

      playNotificationSound();
    });

    socket.on('user-typing', (data: any) => {
      setTypingUsers(prev => new Set(prev).add(data.username));
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
      }, 3000);
    });

    socket.on('user-stopped-typing', (data: any) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    });

    socket.on('notification', (notification: any) => {
      setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
      showBrowserNotification(notification);
    });

    socket.on('user-status-change', (data: any) => {
      setOnlineUsers(prev =>
        prev.map(u => (u._id === data.userId ? { ...u, status: data.status, lastSeen: data.lastSeen } : u))
      );
    });

    socket.on('reaction-updated', (data: any) => {
      setMessages(prev =>
        prev.map(msg => (msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg))
      );
    });

    return () => {
      socket.off('new-message');
      socket.off('new-private-message');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.off('notification');
      socket.off('user-status-change');
      socket.off('reaction-updated');
    };
  }, [token, user, currentRoom, currentPrivateChat]);

  useEffect(() => {
    if (token) {
      loadOnlineUsers();
    }
  }, [token]);

  useEffect(() => {
    if (currentPrivateChat && token) {
      loadPrivateMessages(currentPrivateChat);
      setUnreadCounts(prev => {
        const newMap = new Map(prev);
        newMap.delete(currentPrivateChat);
        return newMap;
      });
    }
  }, [currentPrivateChat, token]);

  const loadMessages = async () => {
    if (!token) return;
    try {
      const data = await api.getRoomMessages(token, currentRoom, 1);
      setMessages(data.messages);
      setHasMoreMessages(data.hasMore);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadPrivateMessages = async (userId: string) => {
    if (!token) return;
    try {
      const data = await api.getPrivateMessages(token, userId, 1);
      setPrivateMessages(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, data.messages);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to load private messages:', error);
    }
  };

  const loadOnlineUsers = async () => {
    if (!token) return;
    try {
      const data = await api.getUsers(token);
      setOnlineUsers(data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const sendMessage = (content: string) => {
    const socket = socketService.getSocket();
    if (socket && content.trim()) {
      socket.emit('send-message', { content, room: currentRoom });
    }
  };

  const sendPrivateMessage = (recipientId: string, content: string) => {
    const socket = socketService.getSocket();
    if (socket && content.trim()) {
      socket.emit('send-private-message', { recipientId, content });
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2i57OmfTgwOUKnj8Lh');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const showBrowserNotification = (notification: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Message', {
        body: notification.message,
        icon: '/vite.svg'
      });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const loadMoreMessages = async () => {
    if (!token || !hasMoreMessages) return;
    try {
      const nextPage = currentPage + 1;
      const data = await api.getRoomMessages(token, currentRoom, nextPage);
      setMessages(prev => [...data.messages, ...prev]);
      setHasMoreMessages(data.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  };

  const searchMessages = async (query: string) => {
    if (!token || !query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api.searchMessages(token, query, currentRoom);
      setSearchResults(data.messages);
    } catch (error) {
      console.error('Failed to search messages:', error);
    }
  };

  const addReaction = (messageId: string, reactionType: string) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('add-reaction', { messageId, reactionType });
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        privateMessages,
        currentRoom,
        setCurrentRoom,
        currentPrivateChat,
        setCurrentPrivateChat,
        sendMessage,
        sendPrivateMessage,
        onlineUsers,
        typingUsers,
        notifications,
        clearNotifications,
        loadMoreMessages,
        hasMoreMessages,
        searchMessages,
        searchResults,
        addReaction,
        unreadCounts
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
