const cron = require('node-cron');
const User = require('../models/user');
const { format, isToday } = require('date-fns');

const startEventNotificationCron = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            // Get all users with events
            const users = await User.find({ 'events.0': { $exists: true } }).populate('friends');
            
            for (const user of users) {
                const todayEvents = user.events.filter(event => isToday(new Date(event.date)));
                
                if (todayEvents.length > 0) {
                    // Create notifications for each friend
                    const notificationPromises = user.friends.map(async (friend) => {
                        const notifications = todayEvents.map(event => ({
                            eventId: event._id,
                            type: event.type,
                            userId: user._id,
                            userName: user.username,
                            userProfilePic: user.profile_picture,
                            createdAt: new Date(),
                            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
                        }));

                        // Add notifications to friend's eventNotifications array
                        await User.findByIdAndUpdate(
                            friend._id,
                            {
                                $push: {
                                    eventNotifications: {
                                        $each: notifications
                                    }
                                }
                            }
                        );
                    });

                    await Promise.all(notificationPromises);
                }
            }

            // Clean up expired notifications
            await User.updateMany(
                {},
                {
                    $pull: {
                        eventNotifications: {
                            expiresAt: { $lt: new Date() }
                        }
                    }
                }
            );

        } catch (error) {
            console.error('Error in event notification cron:', error);
        }
    });
};

module.exports = { startEventNotificationCron };
