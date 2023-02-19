const orderModel = (body: any) => {
  let ownerProfit = 0;
  ownerProfit = (body?.price * 5) / 100;
  ownerProfit = ownerProfit * body?.quantity;
  ownerProfit = parseFloat(ownerProfit.toFixed(2));

  return {
    orderId: body?.orderId,
    trackingId: body?.trackingId,
    user_email: body?.user_email,
    ownerProfit,
    productID: body?.productID,
    title: body?.title,
    slug: body?.slug,
    brand: body?.brand,
    image: body.image,
    sku: body?.sku,
    price: body?.price,
    totalAmount: body?.totalAmount,
    quantity: body?.quantity,
    seller: body.seller,
    payment_mode: body?.payment_mode,
    shipping_address: body?.shipping_address,
    package_dimension: body?.package_dimension,
    delivery_service: body?.delivery_service,
    status: "pending",
    time_pending: new Date().toLocaleString(),
  };
};

module.exports = { orderModel };
