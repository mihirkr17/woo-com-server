"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const order_schema = new mongoose_1.Schema({
    customer: {
        id: { type: String, required: true },
        email: { type: String, required: true },
        shipping_address: Object
    },
});
