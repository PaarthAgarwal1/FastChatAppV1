import { useEffect, useState } from "react";
import { FaCheck, FaHeart } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useFriendStore } from "../../store/useFriendStore";
import { useEventStore } from "../../store/useEventStore";
import { toast } from "react-toastify";

const Notifications = () => {
  const {
    friendRequests,
    getFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
  } = useFriendStore();

  const {
    eventNotifications = [], // Provide default empty array
    getEventNotifications,
    sendEventWish,
    isLoadingNotifications
  } = useEventStore();

  const [activeTab, setActiveTab] = useState('friendRequests');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          getFriendRequests(),
          getEventNotifications()
        ]);
      } catch (error) {
        toast.error("Failed to load notifications");
      }
    };
    fetchData();

    // Refresh event notifications every minute
    const interval = setInterval(() => {
      getEventNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleWish = async (notificationId) => {
    try {
      await sendEventWish(notificationId);
    } catch (error) {
      toast.error("Failed to send wish");
    }
  };

  return (
    <div className="p-4">
      <div className="flex border-b border-gray-600 mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'friendRequests' ? 
            'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('friendRequests')}
        >
          Friend Requests
          {friendRequests.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {friendRequests.length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'events' ? 
            'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('events')}
        >
          Event Notifications
          {(eventNotifications?.filter(n => !n?.wished)?.length || 0) > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {eventNotifications?.filter(n => !n?.wished)?.length || 0}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'friendRequests' ? (
        <>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Friend Requests</h3>
          {friendRequests.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {friendRequests.map((request) => (
                <li key={request._id} className="flex justify-between items-center bg-white/20 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <img
                      src={request.sender_id.profile_picture || "./avatar.png"}
                      alt={request.sender_id.username}
                      className="w-10 h-10 rounded-full border border-gray-300"
                    />
                    <span className="text-white">{request.sender_id.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 bg-blue-400 text-white rounded-md hover:bg-blue-600 transition-all flex items-center"
                      onClick={() => acceptFriendRequest(request._id)}
                    >
                      <FaCheck />
                    </button>
                    <button
                      className="p-1 text-2xl bg-red-400 text-white rounded-md hover:bg-red-600 transition-all flex items-center"
                      onClick={() => declineFriendRequest(request._id)}
                    >
                      <MdDeleteForever />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-300">No new friend requests</p>
          )}
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Event Notifications</h3>
          {isLoadingNotifications ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner"></span>
            </div>
          ) : Array.isArray(eventNotifications) && eventNotifications.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {eventNotifications.map((notification) => (
                <li 
                  key={notification._id} 
                  className={`flex justify-between items-center p-3 rounded-md ${
                    notification.wished ? 'bg-white/10' : 'bg-blue-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={notification.userProfilePic || "./avatar.png"}
                      alt={notification.userName}
                      className="w-10 h-10 rounded-full border border-gray-300"
                    />
                    <div>
                      <p className="text-white">
                        {notification.userName}'s {notification.type} is today!
                      </p>
                      <p className="text-xs text-gray-300">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    className="p-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-all flex items-center disabled:opacity-50 disabled:hover:bg-pink-500"
                    onClick={() => handleWish(notification._id)}
                    disabled={notification.wished}
                  >
                    <FaHeart className="mr-2" />
                    {notification.wished ? 'Wished' : 'Send Wish'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-300">No event notifications</p>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;