import { Schema, model } from "mongoose";

module.exports = model(
  "SHIPPING_ADDRESS_TBL",
  new Schema({
    customerId: { type: Schema.Types.ObjectId, ref: "CUSTOMER_TBL" },
    name: { type: String, default: "", required: false },
    division: { type: String, default: "", required: false },
    city: { type: String, default: "", required: false },
    area: { type: String, default: "", required: false },
    areaType: { type: String, default: "", required: false },
    landmark: { type: String, default: "", required: false },
    phoneNumber: { type: String, default: "", required: false },
    postalCode: { type: String, default: "", required: false },
    active: Boolean,
  })
);
