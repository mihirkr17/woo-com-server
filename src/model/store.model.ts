import { Schema, model } from "mongoose";

const businessTypes = [
  "Fashion and Apparel",
  "Electronics",
  "Home and Furniture",
  "Beauty and Personal Care",
  "Toys and Games",
  "Sports and Outdoors",
  "Books and Media",
  "Handmade and Crafts",
  "Health and Wellness",
  "Automotive",
  "Food and Grocery",
];

const storeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  storeTitle: { type: String, required: [true, "Required store name!"] },
  contactPhone: { type: String, required: [true, "Required phone number!"] },
  contactEmail: {
    type: String,
    required: [true, "Required contact email address!"],
  },
  taxId: { type: String, required: [true, "Required tax id!"] },
  storeType: { type: String, enum: businessTypes, required: true },
  license: { type: String, required: [true, "Required store license!"] },
  address: {
    country: { type: String, required: [true, "Required country name!"] },
    division: { type: String, required: [true, "Required division!"] },
    city: { type: String, required: [true, "Required city or town name!"] },
    thana: { type: String, required: [true, "Required thana name!"] },
    landmark: { type: String, required: [true, "Required landmark!"] },
    postalCode: { type: String, required: [true, "Required postal code!"] },
  },

  location: {
    type: String,
    latitude: Number,
    longitude: Number,
  },
  storeCreatedAt: { type: Date, default: Date.now },
});

module.exports = model("STORE_TBL", storeSchema, "STORE_TBL");
