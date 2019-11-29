const mongoose = require("mongoose");

module.exports = mongoose.connect(process.env.MONGO_CONNECTION, {
  useNewUrlParser: true,
  useCreateIndex: true
});
