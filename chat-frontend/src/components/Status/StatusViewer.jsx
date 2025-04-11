import { useState, useEffect } from 'react';
import { useStatusStore } from '../../store/useStatusStore';
import { X, ChevronLeft, ChevronRight, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatusViewer = ({ userStatuses, initialStatusIndex = 0, onClose, showDeleteButton, onDeleteStatus }) => {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(initialStatusIndex);
  const [progress, setProgress] = useState(0);
  const { viewStatus } = useStatusStore();
  const currentStatus = userStatuses.statuses[currentStatusIndex];

  useEffect(() => {
    if (!currentStatus) return;
    
    viewStatus(currentStatus._id);
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          // Move to next status or close if last
          if (currentStatusIndex < userStatuses.statuses.length - 1) {
            setCurrentStatusIndex(prev => prev + 1);
            return 0;
          } else {
            onClose();
          }
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [currentStatus, currentStatusIndex]);

  const handlePrevStatus = (e) => {
    e.stopPropagation();
    if (currentStatusIndex > 0) {
      setCurrentStatusIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleNextStatus = (e) => {
    e.stopPropagation();
    if (currentStatusIndex < userStatuses.statuses.length - 1) {
      setCurrentStatusIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!currentStatus) return;

    try {
      const success = await onDeleteStatus(currentStatus._id);
      if (success) {
        // If there are no more statuses, close viewer
        if (userStatuses.statuses.length <= 1) {
          onClose();
        } else if (currentStatusIndex === userStatuses.statuses.length - 1) {
          // If deleting last status, go to previous
          setCurrentStatusIndex(prev => prev - 1);
        }
        // Reset progress for next status
        setProgress(0);
      }
    } catch (error) {
      console.error('Failed to delete status:', error);
    }
  };

  const formatTimeAgo = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center">
      <div className="relative w-full h-full md:w-[425px] md:h-[90vh] md:rounded-xl overflow-hidden bg-black/40">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-30 bg-gradient-to-b from-black/60 to-transparent">
          {userStatuses.statuses.map((status, index) => (
            <div key={status._id} className="h-0.5 flex-1 bg-gray-600/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-transform duration-75 origin-left"
                style={{ 
                  transform: `scaleX(${
                    index < currentStatusIndex ? 1 : 
                    index === currentStatusIndex ? progress / 100 : 0
                  })`
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-8 z-20 bg-gradient-to-b from-black/60 via-black/40 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <img
                src={userStatuses.user.profile_picture || '/avatar.png'}
                className="w-10 h-10 rounded-full border border-white/20"
                alt={userStatuses.user.username}
              />
              <div className="text-white">
                <h3 className="font-medium text-sm">{userStatuses.user.username}</h3>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(new Date(currentStatus?.createdAt))}
                </p>
              </div>
            </div>
            {showDeleteButton && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative h-full">
          {currentStatus && (
            <>
              {currentStatus.content.type === 'image' ? (
                <img
                  src={currentStatus.content.url}
                  alt="Status"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={currentStatus.content.url}
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  playsInline
                  muted
                />
              )}

              {/* Caption */}
              {currentStatus.content.caption && (
                <div className="absolute bottom-4 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-center text-sm max-w-md mx-auto">
                    {currentStatus.content.caption}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrevStatus}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white z-20"
          style={{ display: currentStatusIndex === 0 ? 'none' : 'block' }}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={handleNextStatus}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white z-20"
          style={{ display: currentStatusIndex === userStatuses.statuses.length - 1 ? 'none' : 'block' }}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default StatusViewer;
