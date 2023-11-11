import { Schema, model } from "mongoose";

const customerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  taxId: { type: String, required: false },

  contactEmail: { type: String },

  shippingAddress: [
    {
      _id: false,
      id: { type: String, required: false },
      name: { type: String, default: "", required: false },
      division: { type: String, default: "", required: false },
      city: { type: String, default: "", required: false },
      area: { type: String, default: "", required: false },
      areaType: { type: String, default: "", required: false },
      landmark: { type: String, default: "", required: false },
      phoneNumber: { type: String, default: "", required: false },
      postalCode: { type: String, default: "", required: false },
      active: Boolean,
    },
  ],
  customerCreatedAt: { type: Date, default: Date.now },
});

module.exports = model("CUSTOMER_TBL", customerSchema, "CUSTOMER_TBL");
