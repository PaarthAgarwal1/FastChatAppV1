import { AiOutlinePlus } from "react-icons/ai";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../store/useUserStore";
import { useFriendStore } from "../../store/useFriendStore";
import { useState, useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { axiosInstance } from "../../lib/axios";

const ChatList = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { add, setAdd } = useUserStore();
  const { authUser } = useAuthStore();
  const { friends, getFriends } = useFriendStore();
  const { onlineUsers } = useAuthStore();
  const [recentMessages, setRecentMessages] = useState({});
  const [query, setQuery] = useState("");
  const [readMessages, setReadMessages] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('readMessages');
    return new Set(saved ? JSON.parse(saved) : []);
  });

  useEffect(() => {
    getFriends();
  }, []);

  useEffect(() => {
    const fetchRecentMessages = async () => {
      try {
        const promises = friends.map(friend => 
          axiosInstance.get(`/messages/recent/${authUser._id}/${friend._id}`)
        );
        const responses = await Promise.all(promises);
        const messagesMap = {};
        friends.forEach((friend, index) => {
          messagesMap[friend._id] = {
            content: responses[index].data.message,
            timestamp: responses[index].data.timestamp
          };
        });
        setRecentMessages(messagesMap);
      } catch (error) {
        console.error("Error fetching recent messages:", error);
      }
    };

    if (friends.length > 0 && authUser?._id) {
      fetchRecentMessages();
    }
  }, [friends, authUser?._id]);

  // Update messages when new message is received
  useEffect(() => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      let messageContent = newMessage.text;
      
      // Handle different message types
      if (newMessage.text?.startsWith('https://www.google.com/maps')) {
        messageContent = "📍 Shared location";
      } else if (newMessage.file) {
        const fileTypeIcons = {
          'image': '🖼️',
          'video': '🎥',
          'audio': '🎵',
          'document': '📄',
          'other': '📎'
        };
        const icon = fileTypeIcons[newMessage.file.fileType] || '📎';
        messageContent = `${icon} Shared ${newMessage.file.fileType}`;
      }

      setRecentMessages(prev => ({
        ...prev,
        [newMessage.sender_id]: {
          content: messageContent,
          timestamp: newMessage.createdAt
        }
      }));

      // Only remove from read messages if it's not the currently selected chat
      if (selectedUser?._id !== newMessage.sender_id) {
        setReadMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(newMessage.sender_id);
          return newSet;
        });
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [selectedUser?._id]); // Add selectedUser._id as dependency

  // Save to localStorage when readMessages changes
  useEffect(() => {
    localStorage.setItem('readMessages', JSON.stringify([...readMessages]));
  }, [readMessages]);

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(query.toLowerCase())
  );

  const handleChatSelect = (friend) => {
    setSelectedUser(friend);
    const newReadMessages = new Set(readMessages);
    newReadMessages.add(friend._id);
    setReadMessages(newReadMessages);
  };

  return (
    <div className="flex flex-col">
      <div className="search flex items-center gap-2 py-5 px-2">
        <div className="searchBar p-2 flex-1 bg-custom-rgba-search flex items-center gap-2 rounded-lg">
          <img className="w-5 h-5" src="/search.png" alt="Search" />
          <input
            className="bg-transparent w-full border-none outline-none text-white flex-1"
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          onClick={setAdd}
          className="w-9 h-9 flex items-center justify-center bg-custom-rgba-search p-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-300"
        >
          <AiOutlinePlus size={20} color="white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <button
              key={friend._id}
              onClick={() => handleChatSelect(friend)}
              className={`w-full flex items-center gap-5 p-5 cursor-pointer border-b border-slate-500 hover:bg-gray-500 hover:text-gray-900 transition-colors duration-200 
                ${selectedUser?._id === friend._id ? "bg-gray-400 text-gray-900" : ""}`}
            >
              <div className="relative h-10 w-15">
                <img
                  className="w-10 h-10 rounded-full"
                  src={
                    friend?.blocked?.includes(authUser._id)
                      ? "/avatar.png"
                      : friend.profile_picture || "/avatar.png"
                  }
                  alt="Avatar"
                />
                {!friend?.blocked?.includes(authUser._id) && onlineUsers.includes(friend._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-slate-600" />
                )}
              </div>

              <div className="flex flex-col items-start w-full">
                <span className="block font-semibold">{friend.username}</span>
                {!friend?.blocked?.includes(authUser._id) && recentMessages[friend._id]?.content && (
                  <p className={`text-sm truncate text-left w-full ${
                    !readMessages.has(friend._id) 
                      ? 'text-blue-400 font-medium' 
                      : 'text-gray-300'
                  }`}>
                    {recentMessages[friend._id].content}
                  </p>
                )}
              </div>
            </button>
          ))
        ) : (
          <p className="text-gray-300 p-5">No friends found.</p>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* {add && <AddUser />} */}
    </div>
  );
};

export default ChatList;
