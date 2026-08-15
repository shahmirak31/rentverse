const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI;

const connectDatabase = () => {
  mongoose.set('bufferCommands', false);
  mongoose
    .connect(MONGO_URI || 'mongodb://localhost/mock', { useNewUrlParser: true, useUnifiedTopology: true })
    .catch((err) => {
      console.warn("MongoDB not connected — some features may not work");
    });
};

module.exports = connectDatabase;
