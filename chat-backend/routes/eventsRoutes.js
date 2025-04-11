const express=require('express');
const {addEvent,editEvent,deleteEvent,sendEventWish,getEventNotifications}=require('../controllers/eventController');
const protectRoute = require('../middleware/auth.middleware');

const router=express.Router();

router.post('/add-event',protectRoute,addEvent);
router.put('/:id',protectRoute,editEvent);
router.delete('/:id',protectRoute,deleteEvent);
router.post('/wish/:notificationId', protectRoute, sendEventWish);
router.get('/notifications', protectRoute, getEventNotifications);

module.exports=router;