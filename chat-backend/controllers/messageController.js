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

// const sendMessage = async (req, res) => {
//     try {
//         const { receiverId } = req.params;
//         const sender_id = req.user._id;
//         const { text } = req.body;
//         const file = req.file; 
//         console.log(text,file);

//         const sender = await User.findById(sender_id);
//         const receiver = await User.findById(receiverId);

//         if (!sender || !receiver) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         if (sender.blocked.includes(receiverId) || receiver.blocked.includes(sender_id)) {
//             return res.status(403).json({ message: "You can't send messages to this chat" });
//         }

//         let fileURL, fileType;

//         let fileUpload=null;
//         if(file){
//             const mimeType=file.mimeType;
//             let resourceType="auto";

//             if(mimeType.startsWith("image/")){
//                 fileType="image";
//                 resourceType="image";
//             }else if(mimeType.startsWith("video/")){
//                 fileType="video";
//                 resourceType="video";
//             }else if (mimeType.startsWith("audio/")) {
//                 fileType = "audio";
//                 resourceType = "raw";
//             } else if (mimeType.includes("pdf")) {
//                 fileType = "document";
//                 resourceType = "raw";
//             } else {
//                 fileType = "other";
//                 resourceType = "auto";
//             }
//             fileUpload=await cloudinary.uploader.upload(file.path,{
//                 resource_type:resourceType,
//                 folder:"chat_files"
//             });
//             fs.unlinkSync(file.path);
//         }
//         const newMessage=new Message({
//             sender_id,
//             receiver_id:receiverId,
//             text,
//             ...(fileUpload && {
//                 file:{
//                     url:fileUpload.secure_url,
//                     fileType,
//                     fileName:file.originalname,
//                     mimeType:file.mimetype
//                 }
//             })
//         });
//         // if (file) {
//         //     fileType = file.mimetype.startsWith("image/") ? "image" :
//         //                file.mimetype.startsWith("video/") ? "video" :
//         //                file.mimetype.startsWith("application/") ? "document" : "other";

//         //     const uploadResponse = await cloudinary.uploader.upload(file.path, {
//         //         resource_type: fileType === "image" ? "image" : "raw"
//         //     });
//         //     fileURL = uploadResponse.secure_url;

//         //     fs.unlinkSync(file.path); // Remove locally stored file
//         // }

//         // const newMessage = new Message({
//         //     sender_id,
//         //     receiver_id: receiverId,
//         //     text,
//         //     ...(fileURL && { file: { url: fileURL, fileType } })
//         // });

//         await newMessage.save();

//         const receiverSocketId = getReceiverSocketId(receiverId);
//         if (receiverSocketId) {
//             io.to(receiverSocketId).emit('newMessage', newMessage);
//         }

//         res.header("Access-Control-Allow-Origin", "*");
//         res.header("Access-Control-Allow-Headers", "X-Requested-With");
//         res.status(201).json(newMessage);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: error.message });
//     }
// };


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
        const { userId, friendIds } = req.body;
        const messages = await Message.find({
            $or: friendIds.map(friendId => ({
                $or: [{ sender: userId, receiver: friendId }, { sender: friendId, receiver: userId }]
            }))
        })
            .sort({ createdAt: -1 })
            .select("message sender receiver createdAt");

        // Organize messages by friend ID
        const messageMap = {};
        friendIds.forEach(friendId => {
            const message = messages.find(msg => msg.sender === friendId || msg.receiver === friendId);
            messageMap[friendId] = message ? message.message : "No messages yet.";
        });

        res.json(messageMap);
    } catch (error) {
        console.error("Error fetching recent messages:", error);
        res.status(500).json({ error: "Server error" });
    }
};


// const sendMessage = async (req, res) => {
//     try {
//         const { messages } = req.body;
//         console.log("message data from front end is here",messages);
//         const { receiverId } = req.params;
//         const sender_id = req.user._id; // Assuming you get sender from auth middleware

//         if (!receiverId || !messages || !Array.isArray(messages) || messages.length === 0) {
//             return res.status(400).json({ message: "Invalid request. Provide receiver_id, chat_id, and at least one message." });
//         }

//         // Process each message
//         const processedMessages = await Promise.all(
//             messages.map(async (msg) => {
//                 if (msg.message_type !== "text") {
//                     // Upload media to Cloudinary
//                     const uploadedFile = await cloudinary.uploader.upload(msg.content, {
//                         resource_type: "auto" // Automatically detect type (image, video, etc.)
//                     });

//                     return {
//                         content: uploadedFile.secure_url, // Cloudinary URL
//                         message_type: msg.message_type
//                     };
//                 }
//                 return msg; // Text messages remain unchanged
//             })
//         );

//         // Create message document
//         const newMessage = new Message({
//             receiver_id:receiverId,
//             sender_id,
//             messages: processedMessages,
//             status: "sent"
//         });

//         await newMessage.save();
//         res.status(201).json(newMessage);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

module.exports = { getMessages, sendMessage, recentMessage }