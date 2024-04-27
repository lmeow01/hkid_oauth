const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ChallengeSchema = new Schema({
  challenge: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.ObjectId,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", ProjectSchema);
