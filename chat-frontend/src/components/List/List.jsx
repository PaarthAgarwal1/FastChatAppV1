import { useEffect, useState } from "react";
import UserInfo from "./userInfo";
import ChatList from "./chatList";
import Notifications from "./userNotification";
import Sidebar from "../sideBar/sidebar";
import { useAuthStore } from "../../store/useAuthStore";
 // New Notifications Component

const List = ({ setUpdateProfile }) => {
  const [show, setShow] = useState(false);
  const{authUser,checkAuth}=useAuthStore();
  useEffect(() => {
    checkAuth(); 
  }, [authUser, checkAuth]);
  
  return (
    <div className="w-1/4 flex flex-col relative">
      <UserInfo setUpdateProfile={setUpdateProfile} setShow={setShow} />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
      {show ? <Notifications /> : <ChatList />}
      </div>
      <div className="mt-auto">

      <Sidebar/>
      </div>
    </div>
  );
};

export default List;
