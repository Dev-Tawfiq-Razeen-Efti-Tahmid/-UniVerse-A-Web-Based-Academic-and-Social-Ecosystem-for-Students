import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    username: { 
        type: String,
        required: true
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

const Message = mongoose.model('Message', MessageSchema);

export default Message;