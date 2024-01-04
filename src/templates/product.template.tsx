const { stockStatus, calculateDiscount, calculateVolumetricWeight } = require("../utils/common");

function product_variation_template_engine({ available, pricing, attributes, sku }: any) {

  let price = parseInt(pricing?.price);

  let sellingPrice = parseInt(pricing?.sellingPrice);

  return {
    sku,
    attributes: attributes || {},

    pricing: {
      price,
      sellingPrice,
      discount: calculateDiscount({ price, sellingPrice })
    },
    stock: stockStatus(available),
    available,
  }
}

const product_listing_template_engine = (body: any, supplierId: any) => {

  const packageHeight: number = parseFloat(body?.packageHeight);
  const packageLength: number = parseFloat(body?.packageLength);
  const packageWidth: number = parseFloat(body?.packageWidth);
  const packageWeight: number = parseFloat(body?.packageWeight);


  return {
    title: body?.title,

    slug: body?.slug,

    imageUrls: body?.images || [],

    categories: body?.categories.split("/") || [],

    brand: body?.brand || "No Brand",

    highlights: body?.highlights || [],

    supplierId,

    packaged: {
      dimension: {
        height: packageHeight,
        length: packageLength,
        width: packageWidth
      },
      weight: packageWeight,
      weightUnit: 'kg',
      dimensionUnit: 'cm',
      volumetricWeight: calculateVolumetricWeight(packageHeight, packageLength, packageWidth),
      inTheBox: body?.inTheBox
    },

    shipping: {
      fulfilledBy: body?.fulfilledBy,
      procurementSLA: body?.procurementSLA,
      isFree: body?.isFree
    },

    variations: [product_variation_template_engine({
      attributes: body?.attributes,
      sku: body?.sku,
      available: parseInt(body?.available),
      pricing: body?.pricing
    })],

    manufacturer: {
      origin: body?.manufacturerOrigin,
      details: body?.manufacturerDetails,
    },

    warranty: body?.warranty,

    keywords: body?.keywords,

    metaDescription: body?.metaDescription,

    specification: body?.specification || {},

    description: body?.description || "",

    rating: {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0
    },

    ratingAverage: 0,

    isVerified: false,

    createdAt: new Date()
  }
}



module.exports = { product_listing_template_engine, product_variation_template_engine };
