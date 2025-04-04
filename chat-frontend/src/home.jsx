import List from "./components/List/List";
import ProfileUpdate from "./components/UpdateProfile/UpdateProfile";
import ChatContainer from "./components/Chat/ChatContainer";
import NoChatSelected from "./components/Chat/NoChatSelected";
import { useChatStore } from "./store/useChatStore";
import { useUserStore } from "./store/useUserStore";
import AddUser from "./components/List/addUser/addUser";

const Home = () => {
  const { updateUser } = useUserStore();
  const { selectedUser } = useChatStore();
  const{add}=useUserStore();

  return (
    <>
      <List />
      {updateUser ? <ProfileUpdate /> : selectedUser ? <ChatContainer /> : <NoChatSelected />}
      {add&&<AddUser/>}
    </>
  );
};

export default Home;
