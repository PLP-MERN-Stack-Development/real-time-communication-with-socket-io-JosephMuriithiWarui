import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { LogOut, Users, MessageCircle, Hash, Search, X, Bell } from 'lucide-react';

const rooms = ['global', 'general', 'random', 'tech', 'music'];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const {
    currentRoom,
    setCurrentRoom,
    onlineUsers,
    setCurrentPrivateChat,
    currentPrivateChat,
    searchMessages,
    searchResults,
    notifications,
    clearNotifications,
    unreadCounts
  } = useChat();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [view, setView] = useState<'rooms' | 'users'>('rooms');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchMessages(query);
    }
  };

  const handleRoomChange = (room: string) => {
    setCurrentRoom(room);
    setCurrentPrivateChat(null);
  };

  const handleUserClick = (userId: string) => {
    setCurrentPrivateChat(userId);
    setCurrentRoom('');
  };

  return (
    <div className="w-80 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold">
              {user?.username[0].toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{user?.username}</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Online
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <Search className="w-5 h-5" />
            </button>
            <button onClick={logout} className="p-2 hover:bg-gray-700 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleSearch('');
                  }}
                  className="absolute right-2 top-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto text-sm space-y-1">
                {searchResults.map((msg: any) => (
                  <div key={msg._id} className="p-2 hover:bg-gray-600 rounded cursor-pointer">
                    <div className="font-medium text-xs text-gray-400">{msg.sender.username}</div>
                    <div className="truncate">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showNotifications && notifications.length > 0 && (
          <div className="mt-2 bg-gray-700 rounded-lg p-2 max-h-60 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Notifications</span>
              <button onClick={clearNotifications} className="text-xs text-blue-400 hover:text-blue-300">
                Clear all
              </button>
            </div>
            <div className="space-y-1">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="p-2 bg-gray-600 rounded text-sm">
                  <div className="font-medium text-xs text-gray-300">{notif.from}</div>
                  <div className="text-xs">{notif.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setView('rooms')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 ${
            view === 'rooms' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          <Hash className="w-4 h-4" />
          Rooms
        </button>
        <button
          onClick={() => setView('users')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 ${
            view === 'users' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Users ({onlineUsers.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === 'rooms' ? (
          <div className="p-2 space-y-1">
            {rooms.map((room) => (
              <button
                key={room}
                onClick={() => handleRoomChange(room)}
                className={`w-full text-left px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  currentRoom === room && !currentPrivateChat
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <Hash className="w-4 h-4" />
                {room}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {onlineUsers.map((u: any) => (
              <button
                key={u._id}
                onClick={() => handleUserClick(u._id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition flex items-center justify-between ${
                  currentPrivateChat === u._id ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-sm font-medium">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                        u.status === 'online' ? 'bg-green-400' : 'bg-gray-500'
                      }`}
                    ></div>
                  </div>
                  <MessageCircle className="w-4 h-4" />
                  <span>{u.username}</span>
                </div>
                {unreadCounts.get(u._id) ? (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadCounts.get(u._id)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
