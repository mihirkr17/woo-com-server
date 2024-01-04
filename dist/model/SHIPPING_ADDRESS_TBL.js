"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
module.exports = (0, mongoose_1.model)("SHIPPING_ADDRESS_TBL", new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "CUSTOMER_TBL" },
    name: { type: String, default: "", required: false },
    division: { type: String, default: "", required: false },
    city: { type: String, default: "", required: false },
    area: { type: String, default: "", required: false },
    areaType: { type: String, default: "", required: false },
    landmark: { type: String, default: "", required: false },
    phoneNumber: { type: String, default: "", required: false },
    postalCode: { type: String, default: "", required: false },
    active: Boolean,
}));
