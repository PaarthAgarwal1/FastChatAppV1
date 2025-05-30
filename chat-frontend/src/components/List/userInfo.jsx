import { IoIosNotifications } from "react-icons/io";
import { useAuthStore } from "../../store/useAuthStore";
import { useFriendStore } from "../../store/useFriendStore";
import { useState, useEffect } from "react";
import { useUserStore } from "../../store/useUserStore";

const UserInfo = ({ setUpdateProfile, setShow, setShowStatus }) => {
  const { updatingUser } = useUserStore();
  const { authUser } = useAuthStore();
  const { friendRequests } = useFriendStore();
  const [customCss, setCustomCss] = useState("text-white");

  useEffect(() => {
    setCustomCss(friendRequests.length > 0 ? "text-red-500 " : "text-white");
  }, [friendRequests]);

  return (
    <div className="p-5 w-full flex items-center justify-between bg-gray-900/45 rounded-tl">
      <div className="flex items-center gap-2">
        <div 
          className="cursor-pointer relative group"
          onClick={() => setShowStatus(prev => !prev)} // Changed to toggle
        >
          <img
            className="w-[45px] h-[45px] rounded-full object-cover transition-transform group-hover:scale-105"
            src={authUser?.profile_picture || "./avatar.png"}
            alt="Profile"
          />
          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs">Toggle Status</span>
          </div>
        </div>
        <h2 className="font-semibold">{authUser?.username || "User"}</h2>
      </div>
      <div className="flex gap-5">
        <IoIosNotifications
          className={`w-6 h-6 cursor-pointer ${customCss}`}
          onClick={() => setShow((prev) => !prev)}
        />
        <img
          className="w-5 h-5 cursor-pointer"
          src="./edit.png"
          alt="Edit"
          onClick={updatingUser}
        />
      </div>
    </div>
  );
};

export default UserInfo;
