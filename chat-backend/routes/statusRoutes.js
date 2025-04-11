const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/auth.middleware');
const { uploadStatus, getFriendsStatuses, viewStatus, deleteStatus } = require('../controllers/statusController');
const multer = require('multer');
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

router.post('/upload', protectRoute, upload.single('media'), uploadStatus);
router.get('/friends', protectRoute, getFriendsStatuses);
router.post('/view/:statusId', protectRoute, viewStatus);
router.delete('/:statusId', protectRoute, deleteStatus);

module.exports = router;
