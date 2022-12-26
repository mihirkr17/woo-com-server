const productIntroTemplate = (body: any) => {
  return {
    title: body?.title,
    slug: body?.slug,
    save_as: 'draft',
    categories: [body?.category, body?.subCategory, body?.postCategory] || [],
    brand: body?.brand,
    inventoryDetails: {
      fulfillmentBy: body?.fulfillmentBy,
      procurementType: body?.procurementType,
      procurementSLA: body?.procurementSLA
    },
    deliveryDetails: {
      shippingProvider: body?.shippingProvider,
      localDeliveryCharge: parseInt(body?.localDeliveryCharge),
      zonalDeliveryCharge: parseInt(body?.zonalDeliveryCharge),
      nationalDeliveryCharge: parseInt(body?.nationalDeliveryCharge)
    },
    packageInfo: {
      dimension: {
        height: body?.packageHeight,
        length: body?.packageLength,
        width: body?.packageWidth
      },
      weight: body?.packageWeight,
      weightUnit: 'kg',
      dimensionUnit: 'cm',
      inTheBox: body?.inTheBox
    },
    taxDetails: {
      hsn: body?.hsn,
      taxCode: body?.taxCode
    },
    manufacturer: {
      countryOfOrigin: body?.countryOfOrigin,
      manufacturerDetails: body?.manufacturerDetails,
      packerDetails: body?.packerDetails
    },
    paymentInfo: body?.paymentInfo,
    warranty: body?.warranty
  }
}


const productVariation = (body: any) => {
  let available = parseInt(body?.available);
  let stock;

  if (available && available >= 1) {
    stock = "in";
  } else {
    stock = "out";
  }

  return {
    images: body?.images,
    sku: body?.sku,
    pricing: {
      price: parseFloat(body?.price),
      sellingPrice: parseFloat(body?.sellingPrice),
      discount: body?.discount,
      currency: 'BDT'
    },
    variant: body?.variant || {},
    stock,
    available: parseInt(body?.available),
    status: body?.status,
    modifiedAt: new Date(Date.now())
  }
}

module.exports = { productIntroTemplate, productVariation };