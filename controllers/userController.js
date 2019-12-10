const User = require("./../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");

exports.getLogin = (req, res, next) => {
  res.render("./user/login", {
    errorMessage: req.flash("error"),
    user: req.user
  });
};

exports.postLogin = async (req, res, next) => {
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
      { expiresIn: "30m" }
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
      errorMessage: req.flash("error"),
      user: undefined
    });
  }
};

exports.getLogout = (req, res, next) => {
  res.clearCookie("token");
  res.redirect("/login");
};

exports.getSignup = (req, res, next) => {
  res.render("./user/signup", {
    errors: [],
    user: req.user
  });
};

exports.postSignup = async (req, res, next) => {
  const email = req.body.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const password = req.body.password;
  const repeatPassword = req.body.repeatPassword;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("./user/signup", {
      errors: errors.array(),
      user: undefined
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
};

exports.getReset = (req, res, next) => {
  res.render("./user/reset", {
    errorMessage: req.flash("error"),
    user: undefined
  });
};

exports.postReset = async (req, res, next) => {
  let token;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/reset");
    }
    token = buffer.toString("hex");
  });

  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      throw Error("This email doesnt exist");
    }
    user.resetToken = token;
    user.resetDateExpiration = Date.now() + 3600000;
    const result = await user.save();

    if (!result) {
      throw Error("This did not save.");
    }

    sgMail.setApiKey(process.env.SENDGRID_KEY);

    const msg = {
      to: email,
      from: "test@example.com",
      subject: "test email from myself",
      html: `
          <h1>You have made a request</h1>
          <p>To reset your password click here: <a href="http://localhost:3000/reset/${token}">Reset</a></p>
          `
    };
    sgMail.send(msg);
    req.flash("error", "email has been sent");
    return res.render("./user/login", {
      errorMessage: req.flash("error"),
      user: undefined
    });
  } catch (err) {
    req.flash("error", err.message);
    return res.render("./user/reset", {
      errorMessage: req.flash("error"),
      user: undefined
    });
  }
};

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetDateExpiration: { $gt: Date.now() }
    });
    if (!user) {
      req.flash("error", "Invalid or expired link.");
      res.redirect("/login");
    }

    res.render("./user/new-password", {
      errorMessage: null,
      user: null,
      userId: user._id.toString(),
      passwordToken: token
    });
  } catch (err) {}
};

exports.postNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  try {
    const user = await User.findOne({
      resetToken: passwordToken,
      resetDateExpiration: { $gt: Date.now() },
      _id: userId
    });

    if (!user) {
      req.flash("error", "Invalid or expired link.");
      res.redirect("/login");
    }
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetDateExpiration = undefined;
    await user.save();

    res.redirect("/login");
  } catch (err) {
    req.flash("error", "Invalid attempt");
    res.redirect("/login");
  }
};

exports.deleteAccount = async (req, res, next) => {
  const id = req.params.id;
  const userId = req.userId;
  const password = req.body.password;

  try {
    if (id !== userId) {
      throw Error("You cannot delete this user.");
    }
    const validUser = await User.findById({ _id: id });

    if (!validUser) {
      throw Error("Invalid user");
    }
    const isMatch = await bcrypt.compare(password, validUser.password);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const user = await User.findByIdAndDelete({ _id: id });
    console.log(user);
    if (!user) {
      throw Error("Did not delete");
    }

    res.redirect("/login");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/");
  }
};
