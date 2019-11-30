const express = require("express");

const router = express.Router();

router.get("/login", (req, res, next) => {
  res.render("./user/login");
});

router.post("/login", (req, res, next) => {
  res.send("Posted to /login");
});

router.get("/signup", (req, res, next) => {
  res.render("./user/signup");
});
module.exports = router;
