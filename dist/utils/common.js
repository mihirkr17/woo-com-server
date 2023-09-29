"use strict";
module.exports.calculateShippingCost = (volWeight, geo) => {
    let charge;
    volWeight = Math.ceil(volWeight);
    let ratePerKm = 0; // $0.10 per kilometer
    let distance = calculateDistance(geo);
    if (distance <= 10) {
        ratePerKm = 2;
    }
    const shippingCost = ratePerKm * distance * Math.max(volWeight, 1); // Minimum 1 kg
    return shippingCost;
};
module.exports.calculatePopularityScore = (product) => {
    const { views, ratingAverage, sales } = product;
    let viewsWeight = 0.4;
    let ratingWeight = 0.5;
    let salesWeight = 0.3;
    return (views * viewsWeight) + (ratingAverage * ratingWeight) + (sales * salesWeight);
};
module.exports.stockStatus = (available) => {
    let stock;
    available = parseInt(available) || 0;
    if (available >= 0) {
        stock = "in";
    }
    else {
        stock = "out";
    }
    return stock;
};
module.exports.calculateDiscount = (pricing) => {
    const { price, sellingPrice } = pricing;
    const discount = ((price - sellingPrice) / price);
    return Math.floor(discount * 100);
};
module.exports.calculateVolumetricWeight = (height, length, width) => {
    return parseFloat(((height * length * width) / 5000).toFixed(1));
};
function calculateDistance(coordinates) {
    const { toLatitude, toLongitude, fromLatitude, fromLongitude } = coordinates;
    const earthRadiusKm = 6371; // Earth's radius in meters (approximately 6,371 kilometers)
    const toLatitudeRadian = (toLatitude * Math.PI) / 180;
    const fromLatitudeRadian = (fromLatitude * Math.PI) / 180;
    const latDifferenceRadians = ((fromLatitude - toLatitude) * Math.PI) / 180;
    const lngDifferenceRadians = ((fromLongitude - toLongitude) * Math.PI) / 180;
    const haversineA = Math.sin(latDifferenceRadians / 2) ** 2 +
        Math.cos(toLatitudeRadian) * Math.cos(fromLatitudeRadian) * Math.sin(lngDifferenceRadians / 2) ** 2;
    const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));
    const distanceKm = earthRadiusKm * haversineC;
    return distanceKm;
}
function cartContextCalculation(cart) {
    // declare cart calculation variables 
    let amount = 0;
    let totalQuantity = 0;
    let shippingCost = 0;
    let finalAmount = 0;
    let savingAmount = 0;
    let discountShippingCost = 0;
    if (Array.isArray(cart) && cart.length >= 1) {
        cart.forEach((item) => {
            shippingCost += 10;
            amount += item === null || item === void 0 ? void 0 : item.amount;
            totalQuantity += item === null || item === void 0 ? void 0 : item.quantity;
            savingAmount += item === null || item === void 0 ? void 0 : item.savingAmount;
        });
    }
    if (amount <= 499) {
        finalAmount = (amount + shippingCost);
    }
    else {
        finalAmount = amount;
        discountShippingCost += shippingCost;
    }
    return { amount, totalQuantity, shippingCost, finalAmount: parseInt(finalAmount), savingAmount, discountShippingCost };
}
module.exports = { cartContextCalculation };
