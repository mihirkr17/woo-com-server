"use strict";
const cryPto = require("crypto");
module.exports.generateItemID = () => (Math.floor(10000000 + Math.random() * 999999999999));
module.exports.generateTrackingID = () => ("tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString());
module.exports.generateOrderID = () => ("oi_" + cryPto.randomBytes(16).toString('hex'));
