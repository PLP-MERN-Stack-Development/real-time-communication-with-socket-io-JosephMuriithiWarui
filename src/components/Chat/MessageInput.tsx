import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import socketService from '../../services/socket';
import { Send } from 'lucide-react';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, sendPrivateMessage, currentRoom, currentPrivateChat } = useChat();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = () => {
    const socket = socketService.getSocket();
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      if (currentPrivateChat) {
        socket.emit('typing-start', { recipientId: currentPrivateChat });
      } else {
        socket.emit('typing-start', { room: currentRoom });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (currentPrivateChat) {
        socket.emit('typing-stop', { recipientId: currentPrivateChat });
      } else {
        socket.emit('typing-stop', { room: currentRoom });
      }
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      if (currentPrivateChat) {
        sendPrivateMessage(currentPrivateChat, message);
      } else {
        sendMessage(message);
      }
      setMessage('');
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder={currentPrivateChat ? 'Type a private message...' : 'Type a message...'}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </div>
    </form>
  );
};
