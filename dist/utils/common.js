"use strict";
module.exports.calculateShippingCost = (volWeight, areaType = "") => {
    let charge;
    volWeight = Math.ceil(volWeight);
    if (volWeight <= 1) {
        charge = areaType === "local" ? 10 : areaType === "zonal" ? 15 : 15;
    }
    else if (volWeight > 1 && volWeight <= 5) {
        charge = areaType === "local" ? 20 : areaType === "zonal" ? 25 : 25;
    }
    else if (volWeight > 5 && volWeight <= 10) {
        charge = areaType === "local" ? 30 : areaType === "zonal" ? 40 : 40;
    }
    else if (volWeight > 10) {
        charge = areaType === "local" ? 50 : areaType === "zonal" ? 60 : 60;
    }
    return charge;
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
