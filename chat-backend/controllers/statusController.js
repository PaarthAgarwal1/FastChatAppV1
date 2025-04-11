const Status = require('../models/status');
const User = require('../models/user');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadStatus = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: "No file uploaded" });

        const uploadResult = await cloudinary.uploader.upload(file.path, {
            resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
            folder: 'status'
        });

        fs.unlinkSync(file.path);

        const status = await Status.create({
            user: req.user._id,
            content: {
                url: uploadResult.secure_url,
                type: file.mimetype.startsWith('video/') ? 'video' : 'image',
                caption: req.body.caption
            }
        });

        res.status(201).json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFriendsStatuses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Get all statuses
        const statuses = await Status.find({
            user: { $in: [...user.friends, req.user._id] },
            expiresAt: { $gt: new Date() }
        })
        .populate('user', 'username profile_picture')
        .populate('views.user', 'username profile_picture')
        .sort('-createdAt');

        // Group statuses by user
        const groupedStatuses = statuses.reduce((acc, status) => {
            const userId = status.user._id.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    user: status.user,
                    statuses: []
                };
            }
            acc[userId].statuses.push(status);
            return acc;
        }, {});

        res.json(Object.values(groupedStatuses));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const viewStatus = async (req, res) => {
    try {
        const status = await Status.findById(req.params.statusId);
        if (!status) return res.status(404).json({ message: "Status not found" });

        if (!status.views.some(view => view.user.toString() === req.user._id.toString())) {
            status.views.push({ user: req.user._id });
            await status.save();
        }

        res.json({ message: "Status viewed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteStatus = async (req, res) => {
    try {
        const status = await Status.findOne({
            _id: req.params.statusId,
            user: req.user._id
        });

        if (!status) return res.status(404).json({ message: "Status not found" });

        await status.deleteOne();
        res.json({ message: "Status deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadStatus,
    getFriendsStatuses,
    viewStatus,
    deleteStatus
};
