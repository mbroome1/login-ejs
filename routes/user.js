const express = require("express");
const User = require("./../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const router = express.Router();

//Login route - GET
router.get("/login", (req, res, next) => {
  console.log(req.flash("error"));
  res.render("./user/login", {
    errorMessage: "",
    user: req.user
  });
});

//Login route - POST
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address"),
    body("password")
      .not()
      .isEmpty()
  ],
  async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        throw new Error("Email not found");
      }
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign(
        { email: user.email, userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "20s" }
      );

      res
        .cookie("token", token, {
          httpOnly: true
        })
        .redirect("/");
    } catch (err) {
      console.log(err.message);
      req.flash("error", err.message);
      return res.render("./user/login", {
        errorMessage: req.flash("error")
      });
    }
  }
);

//Logout route - POST
router.post("/logout", (req, res, next) => {
  res.coo;
  res.render("./user/login", {
    errorMessage: "",
    user: req.user
  });
});

//Signup route - GET
router.get("/signup", (req, res, next) => {
  res.render("./user/signup", {
    errors: [],
    user: req.user
  });
});

//Signup route - POST
router.post(
  "/signup",
  [
    body("firstName")
      .not()
      .isEmpty()
      .withMessage("First name not provided"),
    body("lastName")
      .not()
      .isEmpty()
      .withMessage("Last name not provided"),
    body("email")
      .not()
      .isEmpty()
      .isEmail()
      .trim()
      .withMessage("Email not correct")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(existingUser => {
          if (existingUser) {
            return Promise.reject(
              "A user with this email was found. Please use another."
            );
          }
        });
      }),
    body("password", "Invalid password format")
      .not()
      .isEmpty()
      .trim(),
    body("repeatPassword", "passwords do no match").custom(
      (value, { req }) => value === req.body.password
    )
  ],
  async (req, res, next) => {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;
    const repeatPassword = req.body.repeatPassword;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(422).render("./user/signup", {
        errors: errors.array()
      });
    }
    // console.log(email, firstName, lastName, password);
    try {
      //Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword
      });
      await user.save();
      res.redirect("/login");
    } catch (err) {
      //console.log(error)
      next(err);
    }
  }
);

module.exports = router;
