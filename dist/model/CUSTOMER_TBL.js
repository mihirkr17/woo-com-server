"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const customerSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
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
module.exports = (0, mongoose_1.model)("CUSTOMER_TBL", customerSchema, "CUSTOMER_TBL");
