
require('dotenv').config();

const app = require('./server');
const connectDB = require('./src/config/connectDB');

const PORT = process.env.PORT || 2005;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(
        `LSync server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
