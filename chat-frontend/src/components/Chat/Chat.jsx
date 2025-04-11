import { useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import MessageInput from "./messageInput";
import ChatHeader from "./chatHeader";
import { useUserStore } from "../../store/useUserStore";
import MessageSkeleton from "./messageSkeleton";
import { formatMessageTime } from "../../lib/utils";
import { useAuthStore } from "../../store/useAuthStore";
import { FaFileAlt, FaMusic } from 'react-icons/fa';
import LocationMap from "./locationMap";

const Chat = () => {
  const { selectedUser, isMessageLoading, messages, getMessages, subscribeToMessage, unsubscribeToMessage } = useChatStore();
  const { isUserDetail } = useUserStore();
  const { authUser } = useAuthStore();
  const endRef = useRef(null);

  const isBlockedBySelectedUser = selectedUser?.blocked?.includes(authUser._id);
  const isGoogleMapsUrl = (text) => {
    return text && text.startsWith("https://www.google.com/maps");
  };

  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser._id);
    subscribeToMessage();

    return () => {
      unsubscribeToMessage();
    };
  }, [selectedUser]);

  useEffect(() => {
    if (endRef.current) {
      setTimeout(() => {
        endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [messages.length]);

  const renderMessageContent = (message) => {
    if (message.file) {
      switch (message.file.fileType) {
        case 'image':
          return (
            <img
              src={message.file.url}
              alt="Attachment"
              className="max-w-[180px] sm:max-w-[200px] rounded-md mb-2 object-cover"
            />
          );
        case 'video':
          return (
            <video controls className="max-w-[220px] sm:max-w-[250px] rounded-md mb-2">
              <source src={message.file.url} type={message.file.mimeType} />
              Your browser does not support this video.
            </video>
          );
        case 'audio':
          return (
            <div className="flex flex-col items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md w-full ">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 px-7">{message.file.fileName}</h3>
              <audio controls className="w-full rounded-lg">
                <source src={message.file.url} type={message.file.mimeType} />
                Your browser does not support audio.
              </audio>
            </div>

          );
        case 'document':
          return (
            <div className="flex items-center bg-gray-700 p-3 rounded-lg shadow-sm max-w-[280px]">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-600 rounded-full">
                <FaFileAlt className="text-gray-300 text-xl" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {message.file.fileName || 'Document'}
                </p>
                <a
                  href={message.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:underline"
                >
                  View Document
                </a>
              </div>
            </div>
          );
        default:
          return (
            <a
              href={message.file.url}
              download
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              📎 {message.file.fileName || 'Download File'}
            </a>
          );
      }
    }

    if (message.text) {
      if (isGoogleMapsUrl(message.text)) {
        return (
          <div className="flex flex-col gap-2">
            <LocationMap 
              locationUrl={message.text} 
              className="w-64 h-48 sm:w-72 sm:h-56 rounded-lg overflow-hidden"
            />
            <a
              href={message.text}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-sm text-center"
            >
              📍 Open in Google Maps
            </a>
          </div>
        );
      }
      return (
        <p className={`p-2 text-sm rounded-lg max-w-[280px] sm:max-w-[320px] break-words ${message.sender_id === authUser._id
            ? "bg-blue-500 text-white"
            : "bg-gray-600 text-white"
          }`}>
          {message.text}
        </p>
      );
    }

    return null;
  };

  if (isMessageLoading) {
    return (
      <div className={`flex flex-col border-l border-r border-slate-500 ${isUserDetail ? "w-full md:basis-2/3" : "w-full"
        }`}>
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className={`flex flex-col border-l border-r border-slate-500 ${isUserDetail ? "w-full md:basis-2/3" : "w-full"
      }`}>
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex gap-3 sm:gap-5 mb-3 sm:mb-4 ${message.sender_id === authUser._id
                ? "ml-auto flex-row-reverse"
                : ""
              }`}
            ref={endRef}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border overflow-hidden flex-shrink-0">
              <img
                src={
                  message.sender_id === authUser._id
                    ? authUser.profile_picture || "/avatar.png"
                    : !isBlockedBySelectedUser
                      ? selectedUser.profile_picture || "/avatar.png"
                      : "/avatar.png"
                }
                alt="profile pic"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`flex flex-col gap-1 sm:gap-2 ${message.sender_id === authUser._id
                ? "items-end"
                : "items-start"
              }`}>
              {renderMessageContent(message)}
              <span className="text-xs text-gray-400">
                {formatMessageTime(message.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>
      <MessageInput />
    </div>
  );
};

export default Chat;