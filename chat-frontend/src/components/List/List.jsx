import { useEffect, useState } from "react";
import { X } from 'lucide-react'; // Add this import
import UserInfo from "./userInfo";
import ChatList from "./chatList";
import Notifications from "./userNotification";
import Sidebar from "../sideBar/sidebar";
import { useAuthStore } from "../../store/useAuthStore";
import StatusView from "../Status/StatusView";

const List = ({ setUpdateProfile }) => {
  const [show, setShow] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const { authUser, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [authUser, checkAuth]);

  return (
    <div className="w-1/4 flex flex-col relative">
      <UserInfo 
        setUpdateProfile={setUpdateProfile} 
        setShow={setShow} 
        setShowStatus={setShowStatus} 
      />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {show ? (
          <Notifications />
        ) : showStatus ? (
          <div className="relative">
            <StatusView />
            <button 
              onClick={() => setShowStatus(false)}
              className="absolute top-2 right-2 p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        ) : (
          <ChatList />
        )}
      </div>
      <div className="mt-auto">
        <Sidebar />
      </div>
    </div>
  );
};

export default List;
