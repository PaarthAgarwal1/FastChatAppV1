import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  IoMdArrowDropdown, 
  IoMdArrowDropup, 
  IoMdDownload, 
  IoMdClose, 
  IoMdCloseCircle,
  IoMdDocument,
  IoMdImage,
  IoMdVideocam,
  IoMdMusicalNote
} from "react-icons/io";
import { useChatStore } from "../../store/useChatStore";
import { useUserStore } from "../../store/useUserStore";

const downloadFile = async (fileUrl, fileName) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || `file-${Date.now()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading the file:", error);
  }
};

const Detail = () => {
  const { selectedUser, messages } = useChatStore();
  const { authUser, blockUser, unblockUser } = useAuthStore();
  const { userDetails } = useUserStore();
  const [expandedSections, setExpandedSections] = useState({
    sharedFiles: false,
    sharedMedia: false,
  });
  
  // Separate files by type
  const [files, setFiles] = useState({
    images: [],
    videos: [],
    audio: [],
    documents: [],
    other: []
  });

  useEffect(() => {
    const newFiles = {
      images: [],
      videos: [],
      audio: [],
      documents: [],
      other: []
    };

    messages.forEach(msg => {
      if (msg.file) {
        const file = {
          url: msg.file.url,
          type: msg.file.fileType,
          name: msg.file.fileName || `file-${Date.now()}`,
          mimeType: msg.file.mimeType
        };

        switch(msg.file.fileType) {
          case 'image':
            newFiles.images.push(file);
            break;
          case 'video':
            newFiles.videos.push(file);
            break;
          case 'audio':
            newFiles.audio.push(file);
            break;
          case 'document':
            newFiles.documents.push(file);
            break;
          default:
            newFiles.other.push(file);
        }
      } else if (msg.image) {
        newFiles.images.push({
          url: msg.image,
          type: 'image',
          name: msg.image.split("/").pop().split("?")[0] || `image-${Date.now()}.jpg`
        });
      }
    });

    setFiles(newFiles);
  }, [messages]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isBlocked = authUser?.blocked?.includes(selectedUser._id);
  const isBlockedBySelectedUser = selectedUser?.blocked?.includes(authUser._id);

  const handleBlockToggle = async () => {
    if (isBlocked) {
      await unblockUser(selectedUser._id);
    } else {
      await blockUser(selectedUser._id);
    }
  };

  useEffect(() => {
    setExpandedSections({
      sharedFiles: false,
      sharedMedia: false,
    });
  }, [selectedUser]);

  const getFileIcon = (type) => {
    switch(type) {
      case 'image': return <IoMdImage className="text-blue-400" />;
      case 'video': return <IoMdVideocam className="text-red-400" />;
      case 'audio': return <IoMdMusicalNote className="text-purple-400" />;
      case 'document': return <IoMdDocument className="text-green-400" />;
      default: return <IoMdDocument className="text-gray-400" />;
    }
  };

  return (
    <div className="basis-full md:basis-1/3 flex-1 rounded-lg shadow-md max-w-full w-full bg-gray-800 text-white flex flex-col">
      {/* User Info */}
      <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex flex-col items-center gap-2 border-b border-gray-600">
        <img
          src={!isBlockedBySelectedUser ? selectedUser?.profile_picture || "./avatar.png" : "./avatar.png"}
          alt="User Avatar"
          className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover ring-2 ring-slate-500 shadow-blue-500"
        />
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-center">
          {selectedUser?.username || "User Name"}
        </h2>
        <p className="text-gray-300 text-center text-xs sm:text-sm md:text-base">
          {!isBlockedBySelectedUser ? selectedUser?.description || "No bio available" : "No bio available"}
        </p>
        <button onClick={userDetails} className="absolute top-2 right-2">
          <IoMdCloseCircle className="text-xl sm:text-2xl text-gray-500 hover:text-gray-300 transition-transform duration-200 hover:scale-110" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 p-3 sm:p-4 md:p-5 overflow-y-auto custom-scrollbar">
        {/* Shared Media Section */}
        <div className="mb-4">
          <div
            className="flex justify-between items-center cursor-pointer py-2"
            onClick={() => toggleSection("sharedMedia")}
          >
            <span className="text-sm sm:text-base md:text-lg font-medium">Shared Media</span>
            {expandedSections.sharedMedia ? (
              <IoMdArrowDropup className="text-gray-400 text-lg sm:text-xl" />
            ) : (
              <IoMdArrowDropdown className="text-gray-400 text-lg sm:text-xl" />
            )}
          </div>
          
          {expandedSections.sharedMedia && (
            <div className="space-y-4 mt-2">
              {/* Images */}
              {files.images.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                    <IoMdImage className="text-blue-400" /> Images ({files.images.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {files.images.map((file, idx) => (
                      <div key={`image-${idx}`} className="relative group">
                        <img
                          src={file.url}
                          alt={`Shared image ${idx}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => downloadFile(file.url, file.name)}
                          disabled={isBlockedBySelectedUser}
                          className="absolute bottom-1 right-1 p-1 bg-gray-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <IoMdDownload className={`text-sm ${isBlockedBySelectedUser ? 'text-gray-500' : 'text-white'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {files.videos.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                    <IoMdVideocam className="text-red-400" /> Videos ({files.videos.length})
                  </h4>
                  <div className="space-y-2">
                    {files.videos.map((file, idx) => (
                      <div key={`video-${idx}`} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                        <div className="flex items-center gap-2">
                          <IoMdVideocam className="text-red-400 text-lg" />
                          <span className="text-xs sm:text-sm text-gray-300 truncate max-w-[120px] sm:max-w-[180px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadFile(file.url, file.name)}
                          disabled={isBlockedBySelectedUser}
                          className="p-1"
                        >
                          <IoMdDownload className={`text-lg ${isBlockedBySelectedUser ? 'text-gray-600' : 'text-gray-400 hover:text-gray-200'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio */}
              {files.audio.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                    <IoMdMusicalNote className="text-purple-400" /> Audio ({files.audio.length})
                  </h4>
                  <div className="space-y-2">
                    {files.audio.map((file, idx) => (
                      <div key={`audio-${idx}`} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                        <div className="flex items-center gap-2">
                          <IoMdMusicalNote className="text-purple-400 text-lg" />
                          <span className="text-xs sm:text-sm text-gray-300 truncate max-w-[120px] sm:max-w-[180px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadFile(file.url, file.name)}
                          disabled={isBlockedBySelectedUser}
                          className="p-1"
                        >
                          <IoMdDownload className={`text-lg ${isBlockedBySelectedUser ? 'text-gray-600' : 'text-gray-400 hover:text-gray-200'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {files.documents.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                    <IoMdDocument className="text-green-400" /> Documents ({files.documents.length})
                  </h4>
                  <div className="space-y-2">
                    {files.documents.map((file, idx) => (
                      <div key={`doc-${idx}`} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                        <div className="flex items-center gap-2">
                          <IoMdDocument className="text-green-400 text-lg" />
                          <span className="text-xs sm:text-sm text-gray-300 truncate max-w-[120px] sm:max-w-[180px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadFile(file.url, file.name)}
                          disabled={isBlockedBySelectedUser}
                          className="p-1"
                        >
                          <IoMdDownload className={`text-lg ${isBlockedBySelectedUser ? 'text-gray-600' : 'text-gray-400 hover:text-gray-200'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Files */}
              {files.other.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                    <IoMdDocument className="text-gray-400" /> Other Files ({files.other.length})
                  </h4>
                  <div className="space-y-2">
                    {files.other.map((file, idx) => (
                      <div key={`other-${idx}`} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                        <div className="flex items-center gap-2">
                          <IoMdDocument className="text-gray-400 text-lg" />
                          <span className="text-xs sm:text-sm text-gray-300 truncate max-w-[120px] sm:max-w-[180px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadFile(file.url, file.name)}
                          disabled={isBlockedBySelectedUser}
                          className="p-1"
                        >
                          <IoMdDownload className={`text-lg ${isBlockedBySelectedUser ? 'text-gray-600' : 'text-gray-400 hover:text-gray-200'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.values(files).every(arr => arr.length === 0) && (
                <div className="text-gray-400 text-xs sm:text-sm">
                  No shared media available.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      {authUser && (
        <div className="p-3 sm:p-4 border-t border-gray-700 flex flex-col gap-2 mt-auto">
          <button 
            onClick={handleBlockToggle}
            className="py-2 px-4 flex items-center justify-center gap-2 text-white rounded-md bg-red-400/35 hover:bg-red-600 transition-colors duration-300 shadow font-medium text-sm sm:text-base w-full"
          >
            <IoMdClose className="text-sm sm:text-base" /> 
            {isBlocked ? "Unblock User" : "Block User"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Detail;