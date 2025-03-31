const express = require('express');
const protectRoute = require('../middleware/auth.middleware');
const { getMessages, sendMessage, recentMessage } = require('../controllers/messageController');
const router = express.Router();
const multer = require('multer');
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Supported MIME types
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', // Images
            'video/mp4', 'video/webm', 'video/quicktime', // Videos
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', // Audio
            'application/pdf' // Documents
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
            // For better client-side handling, you could use:
            // cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false);
        }
    }
});

router.get('/:receiverId', protectRoute, getMessages);
router.post('/send/:receiverId', protectRoute, upload.single('file'), sendMessage);
router.get("/recent/:userId/:friendId", protectRoute, recentMessage);

module.exports = router;