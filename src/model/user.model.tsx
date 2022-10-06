var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  displayName: { type: String, default: "" },
  role: {
    type: String,
    enum: ["user", "seller", "admin", "owner"],
    default: "user",
  },
  shippingAddress: {
    name: { type: String, default: "" },
    district: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    phoneNumber: { type: Number, default: 0 },
    altPhoneNumber: { type: Number, default: 0 },
    pinCode: { type: Number, default: 0 },
  },
  status: { type: String, enum: ["offline", "online"], default: "offline" },
});

var User = mongoose.model("User", UserSchema, "users");
module.exports = User;
