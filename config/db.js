
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is missing in .env file.');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error('[DB] MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
