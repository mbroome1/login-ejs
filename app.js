const express = require("express");
const mongoose = require("./database/mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/user");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 3000;

const pathToPublic = path.join(__dirname, "public");
app.use(express.static(pathToPublic));

app.set("view engine", "ejs");
app.set("views", "views");

//application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(userRoutes);

app.get("/", (req, res, next) => {
  res.render("index");
});

//default error
app.use((req, res, next) => {
  res.status(404).send("404");
});

app.use((error, req, res, next) => {
  res.send(`Woops..<br><br>${error}`);
});

//mongoose connection string
mongoose
  .then(() => {
    app.listen(port, () => {
      console.log("listening on port: " + port);
    });
  })
  .catch(err => {
    console.log(err);
  });
