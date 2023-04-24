const product_listing_template_engine = (body: any, sellerData: any) => {

  let price = parseFloat(body?.price);
  let sellingPrice = parseFloat(body?.sellingPrice);

  let discount: any = ((price - sellingPrice) / price);
  discount = parseInt(discount) * 100;

  let volumetricWeight: any = ((parseFloat(body?.packageHeight) * parseFloat(body?.packageLength) * parseFloat(body?.packageWidth)) / 5000).toFixed(1);
  volumetricWeight = parseFloat(volumetricWeight);

  return {
    title: body?.title,
    slug: body?.slug,
    categories: [body?.category, body?.subCategory, body?.postCategory] || [],

    brand: body?.brand,

    images: body?.images,

    pricing: {
      price,
      sellingPrice,
      discount,
      currency: 'us'
    },

    sellerData,

    packaged: {
      dimension: {
        height: parseFloat(body?.packageHeight),
        length: parseFloat(body?.packageLength),
        width: parseFloat(body?.packageWidth)
      },
      weight: parseFloat(body?.packageWeight),
      weightUnit: 'kg',
      dimensionUnit: 'cm',
      volumetricWeight,
      inTheBox: body?.inTheBox
    },

    shipping: {
      fulfilledBy: body?.fulfilledBy,
      procurementType: body?.procurementType,
      procurementSLA: body?.procurementSLA,
      provider: body?.shippingProvider,
      isFree: body?.isFree
    },

    tax: {
      hsn: body?.taxHsn,
      code: body?.taxCode
    },

    manufacturer: {
      origin: body?.manufacturerOrigin,
      details: body?.manufacturerDetails,
    },

    warranty: body?.warranty,

    bodyInfo: body?.bodyInfo || {},

    specification: body?.specification || {},

    description: body?.description || ""
  }
}

const product_variation_template_engine = (body: any) => {
  let available = parseInt(body?.available) || 0;
  let priceModifier = parseInt(body?.priceModifier) || 0
  let stock;

  if (available && available >= 1) {
    stock = "in";
  } else {
    stock = "out";
  }

  return {
    vTitle: body?.vTitle,
    sku: body?.sku,
    variant: body?.variant || {},
    attrs: body?.attrs || {},
    highlights: body?.highlight || [],
    priceModifier,
    stock,
    available: parseInt(body?.available),
    status: body?.status
  }
}

module.exports = { product_listing_template_engine, product_variation_template_engine };