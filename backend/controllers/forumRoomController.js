
import ChannelObj from '../models/channel.js';
import Message from '../models/forumMessage.js';


/**
 * GET /channels/:channelId
 * Fetches the channel details and historical messages for rendering the chat room.
 */
export const MessageRoom = async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // 1. Fetch channel details
        const channel = await ChannelObj.findById(channelId);
        
        if (!channel) {
            console.warn(`Channel not found for ID: ${channelId}`);
            // Return a 404 response rendered using the template engine
            return res.status(404).render('404', { message: 'Channel not found' });
        }

        // 2. Fetch up to 100 historical messages for this channel
        const messages = await Message.find({ channel: channelId })
            // Sort by timestamp: 1 for ascending (oldest first)
            .sort({ timestamp: 1 }) 
            .limit(100);

        // 3. Render the chat room page with the data
        res.render("forumRoom", {
            channel, // ES6 short hand for channel: channel
            messages, // ES6 short hand for messages: messages
            user: req.session.userData.username // Assumes user data is available via Express middleware (e.g., session/passport)
        });

    } catch (error) {
        // Log the detailed error on the server side
        console.error("Error loading channel room:", error);
        
        // Send a generic 500 server error response to the client
        res.status(500).send('Server Error');
    }
};

