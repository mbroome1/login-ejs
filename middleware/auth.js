const jwt = require("jsonwebtoken");

// Check if logged in by verifying JWT token.
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || undefined;

    if (!token) {
      throw Error("Please log in to continue.");
    }

    const verifiedToken = await jwt.verify(token, process.env.JWT_SECRET);
    // console.log(verifiedToken);
    if (!verifiedToken) {
      throw Error("Please log in to continue.");
    }
    // console.log(verifiedToken);
    req.userId = verifiedToken.userId;
    next();
  } catch (err) {
    req.flash("error", err.message);
    return res.render("./user/login", {
      errorMessage: req.flash("error"),
      user: undefined
    });
  }
};

// User middleware to make available on all requests
const userMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token || "";
    if (!token) {
      return next();
    }

    // Make userId available on the request if jwt token is still valid.
    await jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.userId = decoded.userId;
      }
      return next();
    });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  auth,
  userMiddleware
};
