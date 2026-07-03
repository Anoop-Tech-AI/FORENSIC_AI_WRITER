const mongoose = require('mongoose');

const connectDB = async () => {
    // Validate MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
        console.error('❌ FATAL ERROR: MONGODB_URI environment variable is not set');
        console.error('Please set MONGODB_URI in your environment variables or Render dashboard');
        console.error('Example: mongodb+srv://<user>:<password>@cluster.mongodb.net/forensic-writer?retryWrites=true&w=majority');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error('Please check your MONGODB_URI is correct and accessible');
        process.exit(1);
    }
};

module.exports = connectDB;
