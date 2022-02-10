const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");

// UserActivity Model
const UserActivity = require("../models/UserActivity");

// Welcome Page
router.get("/", (req, res) => {
  res.render("welcome");
});

// Dashobard (UserActivities Page) + Handle
router.get("/dashboard", ensureAuthenticated, (req, res) => {
  const allActivity = UserActivity.find({}, (err, results) => {
    if (err) {
      console.log(err);
    } else {
      res.render("dashboard", { name: req.user.name, results });
    }
  }).populate("userId");
});

module.exports = router;
