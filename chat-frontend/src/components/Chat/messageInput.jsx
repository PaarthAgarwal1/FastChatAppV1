import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { IoImage, IoSend, IoLocationSharp } from "react-icons/io5";
import { ImBlocked } from "react-icons/im";
import { X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { CiFaceSmile } from "react-icons/ci";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import { FaFileAlt, FaMusic } from 'react-icons/fa';

const MessageInput = () => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [filePreview, setFilePreview] = useState(null);
    const [fileData, setFileData] = useState(null);
    const fileInputRef = useRef(null);
    const { sendMessage, selectedUser } = useChatStore();
    const { authUser } = useAuthStore();

    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        if (authUser?.blocked?.includes(selectedUser?._id)) {
            setIsBlocked(true);
        } else {
            setIsBlocked(false);
        }
    }, [selectedUser, authUser]);

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // console.log("file data ",file);

        // Set file data for FormData
        setFileData(file);

        // Create preview based on file type
        const fileType = file.type.split('/')[0];
        
        const reader = new FileReader();

        if (fileType === 'audio') {
            setFilePreview({
                type: 'audio',
                src: URL.createObjectURL(file),
                name: file.name
            });
        } else {
            reader.onloadend = () => {
                setFilePreview({
                    type: fileType,
                    src: reader.result,
                    name: file.name
                });
            };

            if (fileType === 'image' || fileType === 'video') {
                reader.readAsDataURL(file);
            } else {
                // For documents and other files
                setFilePreview({
                    type: 'other',
                    src: file.name,
                    name: file.name
                });
            }
        }
    };

    const removeImage = () => {
        setFilePreview(null);
        setFileData(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !fileData) return;

        if (fileData) {
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif',
                'video/mp4', 'video/webm',
                'audio/mpeg', 'audio/mp3', 'audio/wav',
                'application/pdf'
            ];

            if (!allowedTypes.includes(fileData.type)) {
                toast.error(`Unsupported file type: ${fileData.type}`);
                return;
            }
        }

        const formData = new FormData();
        if (text.trim()) formData.append("text", text.trim());
        if (fileData) formData.append("file", fileData);

        try {
            await sendMessage(formData);
            setText("");
            setFilePreview(null);
            setFileData(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Failed to send message", error);
            toast.error("Failed to send message");
        }
    };

    const handleSendLocation = async () => {
        if (!navigator.geolocation) {
            return toast.error("Geolocation is not supported by your browser.");
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

                const formData = new FormData();
                formData.append("text", locationUrl);

                try {
                    await sendMessage(formData);
                } catch (error) {
                    console.error("Failed to send location", error);
                    toast.error("Failed to send location");
                }
            },
            () => {
                toast.error("Failed to retrieve location. Please enable GPS.");
            }
        );
    };

    return (
        <div className="p-2 sm:p-4 w-full border-t border-slate-500">
            {filePreview && (
                <div className="mb-2 sm:mb-3 flex items-center gap-2 overflow-x-auto">
                    <div className="relative p-2 border border-gray-300 rounded-lg bg-gray-800">
                        {filePreview.type === "image" && (
                            <img
                                src={filePreview.src}
                                alt="Preview"
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
                            />
                        )}
                        {filePreview.type === "pdf" && (
                            <iframe
                                src={filePreview.src}
                                title="PDF Preview"
                                className="w-32 h-32 sm:w-40 sm:h-40 border rounded"
                            ></iframe>
                        )}
                        {filePreview.type === "video" && (
                            <video controls className="w-32 h-32 sm:w-40 sm:h-40 rounded">
                                <source src={filePreview.src} type={fileData?.type} />
                                Your browser does not support the video tag.
                            </video>
                        )}
                        {filePreview.type === "audio" && (
                            <div className="flex items-center w-full sm:w-40">
                                <FaMusic className="text-gray-600 text-xl sm:text-2xl mr-2" />
                                <audio controls className="w-full p-0">
                                    <source src={filePreview.src} type={fileData?.type} />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}
                        {filePreview.type === "text" && (
                            <pre className="text-gray-200 p-2 bg-gray-900 rounded text-xs sm:text-sm">
                                {filePreview.src}
                            </pre>
                        )}
                        {filePreview.type === "other" && (
                            <div className="text-white text-sm sm:text-base">
                                {filePreview.src}
                            </div>
                        )}

                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center"
                            type="button"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-1 sm:gap-2 items-center rounded-full p-1 sm:p-2 bg-gray-900/40">
                    <button
                        type="button"
                        onClick={handleSendLocation}
                        className="text-red-500 hover:text-red-400"
                        disabled={isBlocked}
                    >
                        <IoLocationSharp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <input
                        type="text"
                        className="flex-1 px-2 bg-transparent outline-none text-gray-100 text-sm sm:text-base"
                        placeholder={isBlocked ? "You can't send a message..." : "Type a message..."}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isBlocked}
                    />

                    <div className="relative">
                        <button
                            type="button"
                            className="text-gray-500 hover:text-gray-300"
                            onClick={() => setOpen((prev) => !prev)}
                            disabled={isBlocked}
                        >
                            <CiFaceSmile className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        {open && (
                            <div className="absolute bottom-10 sm:bottom-12 right-0 z-10">
                                <EmojiPicker 
                                    theme="auto" 
                                    onEmojiClick={handleEmoji}
                                    width={280}
                                    height={350}
                                />
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        accept="image/*,video/*,audio/*,application/pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isBlocked}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-zinc-400 hover:text-emerald-500"
                        disabled={isBlocked}
                    >
                        <IoImage className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                <button
                    type="submit"
                    className="bg-blue-500 text-white p-1 sm:p-2 rounded-full hover:bg-blue-600 transition-colors"
                    disabled={(!text.trim() && !fileData) || isBlocked}
                >
                    {isBlocked ? (
                        <ImBlocked className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                        <IoSend className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                </button>
            </form>
        </div>
    );
};

export default MessageInput;