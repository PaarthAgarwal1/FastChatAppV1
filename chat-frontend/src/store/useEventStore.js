import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { Save } from "lucide-react";

export const useEventStore = create((set, get) => ({
    events: [],
    isLoading: false,
    isCreatingEvent: false,
    isUpdatingEvent: false,
    isDeletingEvent: false,
    eventNotifications: [], // Initialize empty array
    isLoadingNotifications: false,

    SaveEvent: async (eventData) => {
        set({ isCreatingEvent: true });
        try {
            // Format the date before sending
            console.log("Event data before formatting:", eventData);
            const res = await axiosInstance.post("/events/add-event", eventData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            set((state) => ({ events: [...state.events, res.data] }));
            toast.success("Event created successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Error creating event");
            throw error;
        } finally {
            set({ isCreatingEvent: false });
        }
    },

    editEvent: async (eventId, eventData) => {
        set({ isUpdatingEvent: true });
        try {
            const res = await axiosInstance.put(`/events/${eventId}`, eventData);
            
            set((state) => ({
                events: state.events.map(event => 
                    event._id === eventId ? res.data : event
                )
            }));
            toast.success("Event updated successfully!");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Error updating event");
            throw error;
        } finally {
            set({ isUpdatingEvent: false });
        }
    },

    deleteEvent: async (eventId) => {
        console.log("Deleting event with ID:", eventId);
        set({ isDeletingEvent: true });
        try {
            await axiosInstance.delete(`/events/${eventId}`);
            set((state) => ({
                events: state.events.filter(event => event._id !== eventId)
            }));
            toast.success("Event deleted successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Error deleting event");
        } finally {
            set({ isDeletingEvent: false });
        }
    },

    getEventNotifications: async () => {
        set({ isLoadingNotifications: true });
        try {
            const res = await axiosInstance.get("/events/notifications");
            set({ eventNotifications: res.data || [] }); // Ensure we always set an array
            return res.data || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error(error.response?.data?.message || "Failed to fetch notifications");
            set({ eventNotifications: [] }); // Set empty array on error
            return [];
        } finally {
            set({ isLoadingNotifications: false });
        }
    },

    sendEventWish: async (notificationId) => {
        try {
            await axiosInstance.post(`/events/wish/${notificationId}`);
            set(state => ({
                eventNotifications: state.eventNotifications.map(notif =>
                    notif._id === notificationId ? { ...notif, wished: true } : notif
                )
            }));
            toast.success("Wish sent successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send wish");
        }
    }
}));