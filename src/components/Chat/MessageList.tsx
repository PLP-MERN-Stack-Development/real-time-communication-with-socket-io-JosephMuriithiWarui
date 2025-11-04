import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { MessageSquare, Heart, Smile, ThumbsUp, Angry, Frown, Loader } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/date';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  reactions: any[];
}

export const MessageList = () => {
  const { user } = useAuth();
  const { messages, currentPrivateChat, privateMessages, typingUsers, loadMoreMessages, hasMoreMessages, addReaction } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentMessages = currentPrivateChat ? privateMessages.get(currentPrivateChat) || [] : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop === 0 && hasMoreMessages && !currentPrivateChat) {
        loadMoreMessages();
      }
    }
  };

  const reactionEmojis = {
    like: <ThumbsUp className="w-4 h-4" />,
    love: <Heart className="w-4 h-4" />,
    laugh: <Smile className="w-4 h-4" />,
    wow: <MessageSquare className="w-4 h-4" />,
    sad: <Frown className="w-4 h-4" />,
    angry: <Angry className="w-4 h-4" />
  };

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
    >
      {!currentPrivateChat && hasMoreMessages && (
        <div className="flex justify-center">
          <button
            onClick={loadMoreMessages}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <Loader className="w-4 h-4" />
            Load older messages
          </button>
        </div>
      )}

      {currentMessages.map((message: Message) => {
        const isOwnMessage = message.sender._id === user?.id;

        return (
          <div key={message._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
              <div className="flex items-end gap-2">
                {!isOwnMessage && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {message.sender.username[0].toUpperCase()}
                  </div>
                )}

                <div>
                  {!isOwnMessage && (
                    <div className="text-xs text-gray-600 mb-1 px-2">{message.sender.username}</div>
                  )}

                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-2">
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(message.createdAt))}
                    </div>

                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1">
                        {Object.entries(
                          message.reactions.reduce((acc: any, r: any) => {
                            acc[r.type] = (acc[r.type] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([type, count]) => (
                          <button
                            key={type}
                            onClick={() => addReaction(message._id, type)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200"
                          >
                            {reactionEmojis[type as keyof typeof reactionEmojis]}
                            <span>{count as number}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="relative group">
                      <button className="text-xs text-gray-400 hover:text-gray-600">+</button>
                      <div className="hidden group-hover:flex absolute bottom-full left-0 mb-2 bg-white shadow-lg rounded-lg p-2 gap-1">
                        {Object.entries(reactionEmojis).map(([type, icon]) => (
                          <button
                            key={type}
                            onClick={() => addReaction(message._id, type)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {typingUsers.size > 0 && (
        <div className="text-sm text-gray-500 italic">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
