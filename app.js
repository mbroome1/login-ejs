const express = require("express");
const mongoose = require("./database/mongoose");

const userRoutes = require("./routes/user");

const app = express();
const port = process.env.PORT || 3000;

app.use(userRoutes);

app.get("", (req, res, next) => {
  res.send("Hello World");
});

//default error
app.get("*", (req, res, next) => {
  res.status(404).send("404");
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
