import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    // Links the message to the specific channel/room
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    // The user who sent the message
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true
    },
    username: { // Storing username for quick display
        type: String,
        required: true
        // You might populate this from the User model instead
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    reports: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [] // Array of user IDs who reported this message
    }
});

const message = mongoose.model('Message', MessageSchema);

export default message;