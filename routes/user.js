const express = require("express");
const User = require("./../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const router = express.Router();

//Login route - GET
router.get("/login", (req, res, next) => {
  res.render("./user/login", {
    title: "(from route)"
  });
});

//Login route - POST
router.post("/login", (req, res, next) => {
  res.redirect("/");
});

//Signup route - GET
router.get("/signup", (req, res, next) => {
  res.render("./user/signup", {
    errors: []
  });
});

//Signup route - POST
router.post(
  "/signup",
  [
    check("firstName")
      .not()
      .isEmpty()
      .withMessage("First name not provided"),
    check("lastName")
      .not()
      .isEmpty()
      .withMessage("Last name not provided"),
    check("email")
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
    check("password", "Invalid password format")
      .not()
      .isEmpty()
      .trim(),
    check("repeatPassword", "passwords do no match").custom(
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
    } catch (error) {
      //console.log(error)
      next(error);
    }
  }
);

module.exports = router;
