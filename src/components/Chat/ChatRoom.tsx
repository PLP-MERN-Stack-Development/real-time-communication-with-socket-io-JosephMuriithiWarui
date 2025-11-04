import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../../context/ChatContext';
import { Hash, User } from 'lucide-react';

export const ChatRoom = () => {
  const { currentRoom, currentPrivateChat, onlineUsers } = useChat();

  const privateUser = currentPrivateChat
    ? onlineUsers.find((u: any) => u._id === currentPrivateChat)
    : null;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {currentPrivateChat ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                  {privateUser?.username[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{privateUser?.username}</h2>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        privateUser?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></div>
                    {privateUser?.status || 'offline'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">#{currentRoom}</h2>
                  <p className="text-sm text-gray-500">Public channel</p>
                </div>
              </>
            )}
          </div>
        </div>

        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
};
