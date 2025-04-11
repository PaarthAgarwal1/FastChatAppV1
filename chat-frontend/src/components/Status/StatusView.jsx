import { useEffect, useState } from 'react';
import { useStatusStore } from '../../store/useStatusStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Camera, Plus, Trash2, X } from 'lucide-react';
import StatusViewer from './StatusViewer';

const StatusView = () => {
  const { statuses, getFriendsStatuses, uploadStatus, isLoading } = useStatusStore();
  const { authUser } = useAuthStore();
  const [selectedUserStatuses, setSelectedUserStatuses] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    getFriendsStatuses();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const preview = {
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image'
      };
      setPreviewData({ file, preview });
    }
  };

  const handleUpload = async () => {
    if (previewData?.file) {
      try {
        await uploadStatus(previewData.file);
        setPreviewData(null);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const currentUserStatus = statuses.find(status => status.user._id === authUser._id);

  return (
    <div className="p-4 space-y-6 max-h-full overflow-y-auto">
      {/* Current User Status Section */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 p-6 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className={`w-16 h-16 rounded-full border-2 ${
                currentUserStatus ? 'border-blue-500 p-[2px]' : 'border-gray-600'
              }`}>
                <img
                  src={authUser?.profile_picture || "/avatar.png"}
                  alt="Your Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <label className="absolute -bottom-2 -right-2 cursor-pointer bg-blue-500 rounded-full p-2 hover:bg-blue-600 transition-all transform hover:scale-110 shadow-lg">
                <Plus className="w-4 h-4 text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">My Status</h3>
              {currentUserStatus ? (
                <div className="flex flex-col">
                  <p className="text-gray-300 text-sm">
                    {currentUserStatus.statuses.length} status updates
                  </p>
                  <button 
                    onClick={() => setSelectedUserStatuses(currentUserStatus)}
                    className="text-blue-400 text-sm hover:text-blue-300 text-left mt-1 hover:underline"
                  >
                    View my status
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Tap to add status update</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="space-y-4">
        <h3 className="text-gray-400 text-sm font-medium px-2">Recent Updates</h3>
        <div className="space-y-2">
          {statuses
            .filter(status => status.user._id !== authUser._id)
            .map(userStatus => (
              <div
                key={userStatus.user._id}
                onClick={() => setSelectedUserStatuses(userStatus)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-800/40 cursor-pointer transition-all transform hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm"
              >
                <div className={`relative w-14 h-14 rounded-full ${
                  userStatus.statuses.some(status => 
                    !status.views.some(view => view.user._id === authUser._id)
                  )
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900'
                    : 'border-2 border-gray-600'
                }`}>
                  <img
                    src={userStatus.user.profile_picture || '/avatar.png'}
                    className="w-full h-full rounded-full object-cover"
                    alt={userStatus.user.username}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{userStatus.user.username}</p>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {userStatus.statuses.length} new updates
                  </p>
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(userStatus.statuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="w-full max-w-lg p-4 relative">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={handleUpload}
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <span>Share Status</span>
              </button>
              <button
                onClick={() => setPreviewData(null)}
                className="p-2 bg-gray-800/50 text-white rounded-full hover:bg-gray-700/50 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl">
              {previewData.preview.type === 'video' ? (
                <video
                  src={previewData.preview.url}
                  className="w-full rounded-xl"
                  autoPlay
                  loop
                  muted
                  controls
                />
              ) : (
                <img
                  src={previewData.preview.url}
                  alt="Preview"
                  className="w-full rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Viewer Modal */}
      {selectedUserStatuses && (
        <StatusViewer
          userStatuses={selectedUserStatuses}
          onClose={() => setSelectedUserStatuses(null)}
          showDeleteButton={selectedUserStatuses.user._id === authUser._id}
          onDeleteStatus={async (statusId) => {
            const success = await useStatusStore.getState().deleteStatus(statusId);
            if (success) {
              const updatedUserStatus = statuses.find(
                s => s.user._id === selectedUserStatuses.user._id
              );
              
              if (!updatedUserStatus || updatedUserStatus.statuses.length === 0) {
                setSelectedUserStatuses(null);
              } else {
                setSelectedUserStatuses(updatedUserStatus);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default StatusView;
