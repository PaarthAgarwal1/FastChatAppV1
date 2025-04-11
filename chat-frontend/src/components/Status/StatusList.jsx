import { useEffect } from 'react';
import { useStatusStore } from '../../store/useStatusStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Plus } from 'lucide-react';

const StatusList = ({ onStatusClick }) => {
  const { statuses, getFriendsStatuses, isLoading } = useStatusStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getFriendsStatuses();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await useStatusStore.getState().uploadStatus(file);
    }
  };

  return (
    <div className="flex overflow-x-auto gap-2 p-2 bg-gray-800/50 rounded-lg">
      {/* Add Status Button */}
      <div className="flex-shrink-0 w-14 relative">
        <label className="cursor-pointer">
          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Status List */}
      {statuses.map(status => (
        <div
          key={status._id}
          onClick={() => onStatusClick(status)}
          className="flex-shrink-0 w-14 cursor-pointer"
        >
          <div className={`w-14 h-14 rounded-full border-2 ${
            !status.views.some(view => view.user._id === authUser._id)
              ? 'border-blue-500'
              : 'border-gray-500'
          }`}>
            <img
              src={status.user.profile_picture || '/avatar.png'}
              className="w-full h-full rounded-full object-cover"
              alt={status.user.username}
            />
          </div>
          <p className="text-xs text-center text-gray-300 mt-1 truncate">
            {status.user.username}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatusList;
