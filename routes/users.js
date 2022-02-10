const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { ensureAuthenticated } = require("../config/auth");

// User model
const User = require("../models/User");

// UserActivity model
const UserActivity = require("../models/UserActivity");

// Login page
router.get("/login", (req, res) => {
  res.render("login");
});

// Login handle
// Passport was being difficult converting to async/await so I had to compromise
router.post("/login", async (req, res, next) => {
  authenticatedUser = await passport.authenticate("local", (err, user, info) => {
    if (err || !user) {
      const { email, password } = req.body;
      let errors = [];
      errors.push({ msg: "Credentials not found." });
      res.render("login", { errors, email });
    } else {
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);

        const foundUserActivity = await UserActivity.findOne({ userId: user._id });

        // Increment login
        const updatedActivity = { logins: (foundUserActivity.logins += 1) };

        // Update updatedActivity
        await UserActivity.findByIdAndUpdate(foundUserActivity._id, updatedActivity);

        return res.redirect("/dashboard");
      });
    }
  })(req, res, next);
});

// Logout handle
router.get("/logout", async (req, res) => {
  const foundActivity = await UserActivity.findOne({ userId: req.user._id });
  const updatedActivity = { logouts: (foundActivity.logouts += 1) };
  await UserActivity.findByIdAndUpdate(foundActivity._id, updatedActivity);

  res.logout();
  res.flash("success_msg", "You are logged out.");
  res.redirect("/users/login");
});

// Register page
router.get("/register", (req, res) => {
  res.render("register");
});

// Register handle
router.post("/register", async (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  //   Error handling

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields." });
  }

  //   Check passwords match
  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    //   Password validation
    const searchUser = await User.findOne({ email: email });

    if (searchUser) {
      errors.push({ msg: "Email is already registered." });
      res.render("register", {
        errors,
        name,
        email,
        password,
        password2,
      });
    } else {
      const newUser = new User({ name, email, password });
      const salt = await bcrypt.genSalt(10);

      try {
        //   Hash password
        const hashedPass = await bcrypt.hash(newUser.password, salt);

        // Set password to hashed password
        newUser.password = hashedPass;

        // Save newUser
        const registeredUser = await newUser.save();

        // Create newUserActivity tied to user by userId
        const newUserActivity = new UserActivity({ userId: registeredUser._id });

        // Save newUserActivity
        newUserActivity.save();

        req.flash("success_msg", "You are now registered and can log in.");
        res.redirect("/users/login");
      } catch (error) {
        console.log(error);
      }
    }
  }
});

// Profile page
router.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", {
    name: req.user.name,
    email: req.user.email,
    jobTitle: req.user.jobTitle,
  });
});

// Edit profile page
router.get("/editprofile", ensureAuthenticated, (req, res) => {
  res.render("editprofile", {
    name: req.user.name,
    email: req.user.email,
    jobTitle: req.user.jobTitle,
  });
});

// Edit profile handle
router.post("/editprofile", async (req, res) => {
  const { name, email, password2 } = req.body;
  const { _id, date, jobTitle } = req.user;
  let { password } = req.body;
  let errors = [];

  // Error handling

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields." });
  }

  //   Check passwords match
  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    //   Password validation

    // Generate salt
    const salt = await bcrypt.genSalt(10);

    try {
      // Generate hashed password
      const hashedPass = await bcrypt.hash(password, salt);

      // Set password to hashed password
      password = hashedPass;

      const updatedUser = {
        name,
        email,
        password,
        date,
        jobTitle,
      };

      //   save updated user information
      await User.findByIdAndUpdate(_id, updatedUser);

      // Locate UserActivity associated with the updated user
      const locatedNewUserActivity = await UserActivity.findOne({ userId: _id });

      //   increment updatedActivity
      const updatedActivity = { profileUpdates: (locatedNewUserActivity.profileUpdates += 1) };

      //   Update updatedActivity
      await UserActivity.findByIdAndUpdate(locatedNewUserActivity._id, updatedActivity);
      res.redirect("/users/profile");
    } catch (error) {
      console.log(error);
    }
  }
});
