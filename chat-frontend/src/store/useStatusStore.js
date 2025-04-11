import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useStatusStore = create((set, get) => ({
    statuses: [],
    isLoading: false,
    isUploading: false,

    uploadStatus: async (mediaFile, caption) => {
        set({ isUploading: true });
        try {
            const formData = new FormData();
            formData.append('media', mediaFile);
            if (caption) formData.append('caption', caption);

            const res = await axiosInstance.post('/status/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update statuses immediately after upload
            const currentStatuses = get().statuses;
            const authUser = res.data.user;
            
            // Find if user already has statuses
            const userStatusIndex = currentStatuses.findIndex(
                s => s.user._id === authUser._id
            );

            if (userStatusIndex !== -1) {
                // Add to existing user's statuses
                currentStatuses[userStatusIndex].statuses.unshift(res.data);
                set({ statuses: [...currentStatuses] });
            } else {
                // Create new user status entry
                set({
                    statuses: [{
                        user: authUser,
                        statuses: [res.data]
                    }, ...currentStatuses]
                });
            }
            
            toast.success('Status uploaded successfully');
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload status');
            throw error;
        } finally {
            set({ isUploading: false });
        }
    },

    getFriendsStatuses: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get('/status/friends');
            set({ statuses: res.data });
        } catch (error) {
            toast.error('Failed to fetch statuses');
        } finally {
            set({ isLoading: false });
        }
    },

    viewStatus: async (statusId) => {
        try {
            await axiosInstance.post(`/status/view/${statusId}`);
            set(state => ({
                statuses: state.statuses.map(status =>
                    status._id === statusId
                        ? {
                            ...status,
                            views: [...status.views, { user: useAuthStore.getState().authUser }]
                        }
                        : status
                )
            }));
        } catch (error) {
            console.error('Failed to mark status as viewed:', error);
        }
    },

    deleteStatus: async (statusId) => {
        try {
            await axiosInstance.delete(`/status/${statusId}`);
            
            // Update state immediately after successful deletion
            set(state => ({
                statuses: state.statuses.map(userStatus => ({
                    ...userStatus,
                    statuses: userStatus.statuses.filter(s => s._id !== statusId)
                })).filter(userStatus => userStatus.statuses.length > 0)
            }));
            
            toast.success('Status deleted successfully');
            return true;
        } catch (error) {
            toast.error('Failed to delete status');
            return false;
        }
    }
}));
