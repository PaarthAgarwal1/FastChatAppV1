const User = require("../models/user");
const Message = require("../models/message");

const addEvent = async (req, res) => {
    console.log("addEvent called", req.body);
    try {
        const { type, date } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check for duplicate events - this checks both type AND date
        const eventExists = user.events.some(event => 
            event.type === type && event.date === formattedDate
        );
        if (eventExists) {
            return res.status(400).json({ message: "Event already exists" });
        }

        const newEvent = { type, date: date };
        user.events.push(newEvent);
        await user.save();

        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const editEvent=async(req,res)=>{
    try {
        const eventId=req.params.id;
        const { type, date } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const eventIndex = user.events.findIndex(event => event._id.toString() === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ message: "Event not found" });
        }
        const event = user.events[eventIndex];
        if (type) {
            event.type = type;
        }
        if (date) {
            event.date = date;
        }   
        await user.save();
        res.status(200).json({ message: "Event updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const deleteEvent=async(req,res)=>{
    try {
        const eventId=req.params.id;
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const eventIndex = user.events.findIndex(event => event._id.toString() === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ message: "Event not found" });
        }
        user.events.splice(eventIndex, 1);
        await user.save();
        res.status(200).json({ message: "Event deleted successfully", user });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getEventNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('eventNotifications')
            .populate('eventNotifications.userId', 'username profile_picture');

        // Filter out expired notifications
        const currentNotifications = user.eventNotifications.filter(
            notification => notification.expiresAt > new Date()
        );

        res.status(200).json(currentNotifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendEventWish = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        // Find the notification in user's notifications
        const user = await User.findById(userId);
        const notification = user.eventNotifications.id(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.wished) {
            return res.status(400).json({ message: "Already wished" });
        }

        // Create wish message based on event type
        const wishMessage = `Happy ${notification.type}! 🎉 Hope you have a wonderful day!`;

        // Send the wish message
        const newMessage = new Message({
            sender_id: userId,
            receiver_id: notification.userId,
            text: wishMessage
        });

        await newMessage.save();

        // Mark notification as wished
        notification.wished = true;
        await user.save();

        res.status(200).json({ message: "Wish sent successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addEvent,
    editEvent,
    deleteEvent,
    getEventNotifications,
    sendEventWish
};