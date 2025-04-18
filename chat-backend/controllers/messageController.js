const Message = require('../models/message');
const cloudinary = require('../config/cloudinary');
const { getReceiverSocketId, io } = require('../config/socket');
const User = require('../models/user');
const fs = require('fs');

const getMessages = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const sender_id = req.user._id;
        const messages = await Message.find({
            $or: [
                { sender_id: sender_id, receiver_id: receiverId },
                { sender_id: receiverId, receiver_id: sender_id }
            ]
        });
        res.status(200).json(messages);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const sendMessage = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const sender_id = req.user._id;
        const { text } = req.body;
        const file = req.file;

        // Validate users exist and aren't blocked
        const sender = await User.findById(sender_id);
        const receiver = await User.findById(receiverId);
        if (!sender || !receiver) {
            return res.status(404).json({ message: "User not found" });
        }
        if (sender.blocked.includes(receiverId) || receiver.blocked.includes(sender_id)) {
            return res.status(403).json({ message: "You can't send messages to this chat" });
        }

        let fileUploadResult = null;
        if (file) {
            // Determine file type
            const mimeType = file.mimetype;
            let resourceType = "auto";
            let fileType;

            if (mimeType.startsWith("image/")) {
                fileType = "image";
                resourceType = "image";
            } else if (mimeType.startsWith("video/")) {
                fileType = "video";
                resourceType = "video";
            } else if (mimeType.startsWith("audio/")) {
                fileType = "audio";
                resourceType = "raw"; // Audio files should use 'raw' for Cloudinary
            } else if (mimeType.startsWith("application/")) {
                fileType = "document";
                resourceType = "raw";
            } else {
                fileType = "other";
                resourceType = "auto";
            }

            // Upload to Cloudinary with error handling
            try {
                const uploadResponse = await cloudinary.uploader.upload(file.path, {
                    resource_type: resourceType,
                    folder: "chat_media",
                    allowed_formats: ['jpg', 'png', 'mp4', 'mp3', 'pdf'],
                    format: 'auto'
                });
                
                fileUploadResult = {
                    url: uploadResponse.secure_url,
                    fileType,
                    fileName: file.originalname,
                    mimeType: file.mimetype
                };
                
                // Clean up temp file
                fs.unlinkSync(file.path);
            } catch (uploadError) {
                console.error("Cloudinary upload failed:", uploadError);
                // Clean up temp file even if upload fails
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                return res.status(500).json({ 
                    message: "File upload failed",
                    details: uploadError.message 
                });
            }
        }

        // Create and save message
        const newMessage = new Message({
            sender_id,
            receiver_id: receiverId,
            text,
            ...(fileUploadResult && { file: fileUploadResult })
        });

        await newMessage.save();

        // Notify recipient via socket
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Message send error:", {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Clean up any temp files if they exist
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            message: "Failed to send message",
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
};

const recentMessage = async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        
        const recentMessage = await Message.findOne({
            $or: [
                { sender_id: userId, receiver_id: friendId },
                { sender_id: friendId, receiver_id: userId }
            ]
        })
        .sort({ createdAt: -1 })
        .select('text file createdAt sender_id');

        // Format message content
        let messageContent = null;
        
        if (recentMessage) {
            if (recentMessage.text) {
                if (recentMessage.text.startsWith('https://www.google.com/maps')) {
                    messageContent = "📍 Shared location";
                } else {
                    messageContent = recentMessage.text.length > 30 
                        ? recentMessage.text.substring(0, 30) + "..."
                        : recentMessage.text;
                }
            } else if (recentMessage.file) {
                const fileTypeIcons = {
                    'image': '🖼️',
                    'video': '🎥',
                    'audio': '🎵',
                    'document': '📄',
                    'other': '📎'
                };
                const icon = fileTypeIcons[recentMessage.file.fileType] || '📎';
                messageContent = `${icon} Shared ${recentMessage.file.fileType}`;
            }
        }

        res.status(200).json({
            message: messageContent,
            timestamp: recentMessage?.createdAt || null,
            senderId: recentMessage?.sender_id || null
        });

    } catch (error) {
        console.error("Error fetching recent message:", error);
        res.status(500).json({ error: "Failed to fetch recent message" });
    }
};

module.exports = { getMessages, sendMessage, recentMessage }