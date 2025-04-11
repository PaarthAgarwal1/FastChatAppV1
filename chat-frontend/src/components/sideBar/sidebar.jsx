import { useAuthStore } from "../../store/useAuthStore";
import { IoMdLogOut, IoMdSettings } from "react-icons/io";

const Sidebar = () => {
  const { authUser } = useAuthStore();
  const { logout } = useAuthStore();

  return (
    <div className=" w-full bg-gray-900 text-white text-4xl shadow-lg flex justify-end items-center rounded-bl p-4">
      <button className="p-1 hover:bg-gray-700 rounded-md transition">
        <IoMdSettings className="text-3xl" />
      </button>
      {authUser &&
        <button onClick={logout} className="p-1 hover:bg-blue-400 rounded-md transition ">
          <IoMdLogOut className="text-3xl" />
        </button>
      }
    </div>
  );
};

export default Sidebar;
