"use strict";
const orderModel = (body) => {
    let ownerProfit = 0;
    ownerProfit = ((body === null || body === void 0 ? void 0 : body.price) * 5) / 100;
    ownerProfit = ownerProfit * (body === null || body === void 0 ? void 0 : body.quantity);
    ownerProfit = parseFloat(ownerProfit.toFixed(2));
    return {
        orderId: body === null || body === void 0 ? void 0 : body.orderId,
        trackingId: body === null || body === void 0 ? void 0 : body.trackingId,
        user_email: body === null || body === void 0 ? void 0 : body.user_email,
        ownerProfit,
        productId: body === null || body === void 0 ? void 0 : body.productId,
        title: body === null || body === void 0 ? void 0 : body.title,
        slug: body === null || body === void 0 ? void 0 : body.slug,
        brand: body === null || body === void 0 ? void 0 : body.brand,
        image: body.image,
        sku: body === null || body === void 0 ? void 0 : body.sku,
        price: body === null || body === void 0 ? void 0 : body.price,
        totalAmount: body === null || body === void 0 ? void 0 : body.totalAmount,
        quantity: body === null || body === void 0 ? void 0 : body.quantity,
        seller: body.seller,
        payment_mode: body === null || body === void 0 ? void 0 : body.payment_mode,
        shipping_address: body === null || body === void 0 ? void 0 : body.shipping_address,
        package_dimension: body === null || body === void 0 ? void 0 : body.package_dimension,
        delivery_service: body === null || body === void 0 ? void 0 : body.delivery_service,
        status: "pending",
        time_pending: new Date().toLocaleString(),
    };
};
module.exports = { orderModel };
