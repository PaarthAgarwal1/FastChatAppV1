import { useState, useCallback } from "react";
import { Camera, Trash2, Edit, Plus, Calendar } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "react-toastify";
import { axiosInstance } from "../../lib/axios";
import { useEventStore } from "../../store/useEventStore";

const ProfileUpdate = () => {
    const { SaveEvent, editEvent, deleteEvent, isCreatingEvent, isUpdatingEvent, isDeletingEvent } = useEventStore();
    const {
        checkAuth,
        authUser,
        isUpdatingProfile,
        updateProfile,
        isUpdatingProfilePicture,
        updateProfilePicture
    } = useAuthStore();

    const [avatar, setAvatar] = useState({
        file: null,
        url: authUser?.profile_picture || "/avatar.png",
    });

    const [formData, setFormData] = useState({
        username: authUser?.username || "",
        email: authUser?.email || "",
        description: authUser?.description || "",
    });

    const [eventData, setEventData] = useState({
        type: "",
        date: "",
    });

    const [events, setEvents] = useState(authUser?.events || []);
    const [editingEventId, setEditingEventId] = useState(null);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, []);

    const calculateDaysUntil = (dateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(dateString);
        eventDate.setHours(0, 0, 0, 0);
        const timeDiff = eventDate - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) return "Today! 🎉";
        if (daysDiff < 0) return `${Math.abs(daysDiff)} days ago`;
        return `${daysDiff} days remaining`;
    };

    const handleAvatarChange = (e) => {
        const image = e.target.files[0];
        if (!image) return;

        if (!image.type.match(/image.(jpeg|jpg|png|gif)$/)) {
            toast.error("Please select a valid image file (JPEG, JPG, PNG, GIF)");
            return;
        }

        if (image.size > 2 * 1024 * 1024) {
            toast.error("Image size should be less than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = () => {
            const base64Image = reader.result;
            setAvatar({ file: base64Image, url: base64Image });
        };
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEventChange = (e) => {
        setEventData({ ...eventData, [e.target.name]: e.target.value });
        console.log("Event data:", eventData);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!formData.username.trim()) {
            toast.error("Username is required");
            return;
        }

        if (!formData.email.trim()) {
            toast.error("Email is required");
            return;
        }

        try {
            await updateProfile(formData);
            toast.success("Profile updated successfully");
            checkAuth();
        } catch (error) {
            toast.error(error.message || "Failed to update profile");
        }
    };

    const handleUpdatePicture = async (e) => {
        e.preventDefault();
        if (!avatar.file) {
            toast.warning("Please select an image first");
            return;
        }

        try {
            await updateProfilePicture({ profile_picture: avatar.file });
            toast.success("Profile picture updated successfully");
            checkAuth();
        } catch (error) {
            toast.error(error.message || "Failed to update profile picture");
        }
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!eventData.type || !eventData.date) {
            toast.warning("Please fill all event fields");
            return;
        }

        try {
            const result = await SaveEvent(eventData);
            setEvents([...events, result]);
            toast.success("Event added successfully");
            setEventData({ type: "", date: "" });
        } catch (error) {
            toast.error("Failed to save event");
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        if (!eventData.type || !eventData.date) {
            toast.warning("Please fill all event fields");
            return;
        }

        try {
            const res = await editEvent(editingEventId, eventData);
            const updatedEvent = res.user.events.find(event => event._id === editingEventId);
            setEvents(events.map(event =>
                event._id === editingEventId ? updatedEvent: event
            ));
            setEditingEventId(null);
            setEventData({ type: "", date: "" });
            toast.success("Event updated successfully");
        } catch (error) {
            toast.error("Failed to update event");
        }
    };

    const handleEditEvent = (event) => {
        const eventId = event._id;
        setEditingEventId(eventId);
        const formattedDate = new Date(event.date).toISOString().split('T')[0];

        setEventData({
            type: event.type,
            date: formattedDate,
        });
    };

    const handleDeleteEvent = async (eventId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this event?");
        if (!confirmDelete) return;

        try {
            await deleteEvent(eventId);
            setEvents(events.filter(event => event._id !== eventId));
            toast.success("Event deleted successfully");
        } catch (error) {
            toast.error("Failed to delete event");
        }
    };

    return (
        <div className="flex flex-col basis-3/4 border-l border-r border-slate-500 justify-center">
            <div className="backdrop-blur-lg p-4 md:p-10 h-full rounded-lg shadow-md flex flex-col gap-4">
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-100">PROFILE</h2>
                <p className="text-lg md:text-xl text-gray-400">Manage your profile details</p>

                <div className="flex flex-col lg:flex-row gap-8 w-full">
                    {/* Left Column - Events Section */}
                    <div className="mt-6 flex flex-col gap-6 w-full lg:w-1/2 order-1 lg:order-1">
                        <h3 className="text-xl font-semibold text-gray-100">Life Events</h3>

                        <form onSubmit={editingEventId ? handleUpdateEvent : handleAddEvent} className="flex flex-col gap-3 bg-white/5 p-4 rounded-lg">
                            <div className="form-control">
                                <label htmlFor="event-type" className="label text-gray-300">
                                    Event Type
                                </label>
                                <select
                                    id="event-type"
                                    name="type"
                                    value={eventData.type}
                                    onChange={handleEventChange}
                                    className="select select-bordered w-full  focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">What are you celebrating?</option>
                                    <option value="Birthday">Birthday</option>
                                    <option value="Work Anniversary">Work Anniversary</option>
                                    <option value="Pet's Birthday">Pet's Birthday</option>
                                    <option value="First Date Anniversary">First Date Anniversary</option>
                                    <option value="Friendiversary">Friendiversary</option>
                                    <option value="Personal Achievement">Personal Achievement</option>
                                    <option value="Travel Memory">Travel Memory</option>
                                    <option value="Other">Other Special Day</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label htmlFor="event-date" className="label text-gray-300">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    id="event-date"
                                    name="date"
                                    value={eventData.date}
                                    onChange={handleEventChange}
                                    className="input input-bordered w-full bg-white/10 text-white focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success mt-2 hover:scale-[1.02] transition-transform"
                            >
                                {editingEventId ? (
                                    <span className="flex items-center gap-2">
                                        <Edit size={16} />
                                        Update Event
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Plus size={16} />
                                        Add Event
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="mt-2 max-h-50 overflow-auto">
                            <h4 className="text-lg font-semibold text-gray-100 mb-2">Your Special Days</h4>
                            {events.length === 0 ? (
                                <div className="text-center py-6 text-gray-400">
                                    <Calendar size={48} className="mx-auto mb-2" />
                                    <p>No events added yet</p>
                                    <p className="text-sm">Add your first special day!</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {events
                                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                                        .map((event) => (
                                            <div
                                                key={event._id || event.id}
                                                className="flex justify-between items-center p-3 border border-gray-600 rounded-lg hover:bg-white/5 transition-colors group"
                                            >
                                                <div>
                                                    <strong className="text-white group-hover:text-blue-300 transition-colors">
                                                        {event.type}
                                                    </strong>
                                                    <p className="text-gray-300 text-sm">
                                                        {formatDate(event.date)} • {calculateDaysUntil(event.date)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditEvent(event)}
                                                        className="btn btn-sm btn-ghost text-blue-400 hover:text-blue-300"
                                                        disabled={isUpdatingEvent}
                                                        aria-label="Edit event"
                                                    >
                                                        {isUpdatingEvent && editingEventId === event._id ? (
                                                            <span className="loading loading-spinner loading-xs"></span>
                                                        ) : (
                                                            <Edit size={16} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event._id)}
                                                        className="btn btn-sm btn-ghost text-red-400 hover:text-red-300"
                                                        disabled={isDeletingEvent}
                                                        aria-label="Delete event"
                                                    >
                                                        {isDeletingEvent ? (
                                                            <span className="loading loading-spinner loading-xs"></span>
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Profile Section */}
                    <div className="flex flex-col gap-6 w-full lg:w-1/2 order-2 lg:order-2 relative">
                        {/* Profile Photo - Positioned top right */}
                        <div className="absolute -top-10 right-0 lg:-top-24">
                            <form
                                onSubmit={handleUpdatePicture}
                                className="flex flex-col gap-3 items-end group"
                            >
                                <div className="relative group">
                                    {/* Profile image with hover effect */}
                                    <div className="relative overflow-hidden rounded-full border-2 border-blue-400 shadow-lg">
                                        <img
                                            src={avatar.url}
                                            alt="Profile"
                                            className="size-24 md:size-42 object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        {/* Semi-transparent overlay on hover */}
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center">
                                            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    </div>

                                    {/* Camera button with improved styling */}
                                    <label
                                        htmlFor="avatar-upload"
                                        className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 p-2 rounded-full cursor-pointer transition-all duration-200 shadow-md border-2 border-white/50 hover:scale-110"
                                        title="Change profile picture"
                                    >
                                        <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                </div>

                                {/* Update button with better visual feedback */}
                                <button
                                    type="submit"
                                    className={`text-xs md:text-sm font-medium text-white py-2 px-4 rounded-md w-full max-w-[150px] transition-all duration-200 shadow-md
                                    ${!avatar.file || isUpdatingProfilePicture
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg'
                                        }`}
                                    disabled={!avatar.file || isUpdatingProfilePicture}
                                >
                                    {isUpdatingProfilePicture ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Uploading...
                                        </span>
                                    ) : (
                                        "Update Photo"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Profile Form */}
                        <form onSubmit={handleUpdate} className="flex flex-col gap-4 mt-38">
                            <div className="form-control">
                                <label htmlFor="username" className="label text-gray-300">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="input input-bordered w-full bg-white/10 text-white focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label htmlFor="email" className="label text-gray-300">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input input-bordered w-full bg-white/10 text-white focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label htmlFor="description" className="label text-gray-300">
                                    About You
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="textarea textarea-bordered w-full bg-white/10 text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tell us about yourself..."
                                ></textarea>
                            </div>

                            <div className="text-sm text-gray-400 mt-2">
                                <span className="font-semibold">Account Created On:</span>{" "}
                                {authUser?.createdAt ? formatDate(authUser.createdAt) : "N/A"}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary mt-4 hover:scale-[1.02] transition-transform"
                                disabled={isUpdatingProfile}
                            >
                                {isUpdatingProfile ? (
                                    <span className="loading loading-spinner"></span>
                                ) : (
                                    "Save Profile Changes"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileUpdate;