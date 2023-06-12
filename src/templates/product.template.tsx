const product_listing_template_engine = (body: any, supplier: any) => {

  let volumetricWeight: any = ((parseFloat(body?.packageHeight) * parseFloat(body?.packageLength) * parseFloat(body?.packageWidth)) / 5000).toFixed(1);
  volumetricWeight = parseFloat(volumetricWeight);

  return {
    title: body?.title,
    slug: body?.slug,
    categories: [body?.category, body?.subCategory, body?.postCategory] || [],

    brand: body?.brand,

    highlights: body?.highlights || [],

    supplier,

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

    keywords: body?.keywords,

    meta_description: body?.meta_description,

    specification: body?.specification || {},

    description: body?.description || ""
  }
}

const product_variation_template_engine = (body: any) => {
  let available: number = parseInt(body?.available) || 0;
  let stock: string;

  let price = parseInt(body?.price);
  let sellingPrice = parseInt(body?.sellingPrice);

  let discount: any = ((price - sellingPrice) / price);

  discount = (discount * 100);

  if (available && available >= 0) {
    stock = "in";
  } else {
    stock = "out";
  }

  return {
    vTitle: body?.vTitle,
    sku: body?.sku,
    variant: body?.variant || {},
    attrs: body?.attrs || {},
    pricing: {
      price,
      sellingPrice,
      discount: parseInt(discount),
      currency: 'bdt'
    },
    stock,
    available,
  }
}

module.exports = { product_listing_template_engine, product_variation_template_engine };