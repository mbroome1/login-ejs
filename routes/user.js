const express = require("express");
const User = require("./../models/user");
const { body } = require("express-validator");

// Controllers
userController = require("./../controllers/userController");

const router = express.Router();

//Login route - GET
router.get("/login", userController.getLogin);

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
  userController.postLogin
);

//Logout route - POST
router.get("/logout", userController.getLogout);

//Signup route - GET
router.get("/signup", userController.getSignup);

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
  userController.postSignup
);

// Reset password route
router.get("/reset", userController.getReset);

router.post("/reset", userController.postReset);

// New Password route - GET
router.get("/reset/:token", userController.getNewPassword);

// New Password route - POST
router.post("/new-password", userController.postNewPassword);

//Delete account route - POST
router.post("/delete/:id", userController.deleteAccount);

module.exports = router;
