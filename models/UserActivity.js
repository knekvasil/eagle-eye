const mongoose = require("mongoose");

const UserActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  registrations: {
    type: Number,
    default: 1,
  },
  logins: {
    type: Number,
    default: 0,
  },
  logouts: {
    type: Number,
    default: 0,
  },
  profileUpdates: {
    type: Number,
    default: 0,
  },
});

const UserActivity = mongoose.model("UserActivity", UserActivitySchema);

module.exports = UserActivity;
