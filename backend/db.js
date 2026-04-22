const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/project_management';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB database.');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
