const express = require("express");
const mongoose = require("./database/mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const session = require("express-session");
const flash = require("connect-flash");

const userRoutes = require("./routes/user");
const { auth, userMiddleware } = require("./middleware/auth");

const User = require("./models/user");

const app = express();
const port = process.env.PORT || 3000;

const pathToPublic = path.join(__dirname, "public");
app.use(express.static(pathToPublic));

app.set("view engine", "ejs");
app.set("views", "views");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

// application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
app.use(flash());

// Cross-site request forgery prevention on forms, and disable cache browser storage
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

// Get user middleware when logged in, and setup user on the request (req.user)
app.use(userMiddleware, async (req, res, next) => {
  if (!req.userId) {
    return next();
  }

  try {
    const user = await User.findById(req.userId);
    req.user = user;
    return next();
  } catch (err) {
    console.log("failed in user middleware");
  }
});

app.use(userRoutes);

app.get("/", auth, (req, res, next) => {
  res.render("index", {
    user: req.user
  });
});

// default error
app.use((req, res, next) => {
  res.status(404).send("404");
});

app.use((error, req, res, next) => {
  res.send(`Woops..<br><br>${error}`);
});

// mongoose connection string
mongoose
  .then(() => {
    app.listen(port, () => {
      console.log("listening on port: " + port);
    });
  })
  .catch(err => {
    console.log(err);
  });
