const { stockStatus, calculateDiscount } = require("../utils/common");

function product_variation_template_engine(body: any) {

  let available: number = parseInt(body?.available) || 0;

  let price = parseInt(body?.pricing?.price);

  let sellingPrice = parseInt(body?.pricing?.sellingPrice);

  return {
    sku: body?.sku,
    variant: body?.variant || {},
    brandColor: body?.brandColor,
    attrs: body?.attrs || {},
    images: body?.images,
    pricing: {
      price,
      sellingPrice,
      discount: calculateDiscount({ price, sellingPrice })
    },
    stock: stockStatus(available),
    available,
  }
}

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
      isFree: body?.isFree
    },

    variations: [product_variation_template_engine(body?.variation)],

    manufacturer: {
      origin: body?.manufacturerOrigin,
      details: body?.manufacturerDetails,
    },

    warranty: body?.warranty,

    keywords: body?.keywords,

    metaDescription: body?.metaDescription,

    specification: body?.specification || {},

    description: body?.description || ""
  }
}



module.exports = { product_listing_template_engine, product_variation_template_engine };
