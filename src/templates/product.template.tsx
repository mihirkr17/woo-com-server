const product_listing_template_engine = (body: any) => {
  return {
    title: body?.title,
    slug: body?.slug,
    categories: [body?.category, body?.subCategory, body?.postCategory] || [],
    brand: body?.brand,
    sellerData: {
      sellerID: body?.sellerData?.sellerID || "",
      sellerName: body?.sellerData?.sellerName || "",
      storeName: body?.sellerData?.storeName || ""
    },
    shipping: {
      fulfilledBy: body?.fulfilledBy,
      procurementType: body?.procurementType,
      procurementSLA: body?.procurementSLA,
      provider: body?.shippingProvider,
      delivery: {
        localCharge: parseInt(body?.localCharge),
        zonalCharge: parseInt(body?.zonalCharge),
      },
      package: {
        dimension: {
          height: body?.packageHeight,
          length: body?.packageLength,
          width: body?.packageWidth
        },
        weight: body?.packageWeight,
        weightUnit: 'kg',
        dimensionUnit: 'cm',
        inTheBox: body?.inTheBox
      }
    },
    tax: {
      hsn: body?.taxHsn,
      code: body?.taxCode
    },
    manufacturer: {
      origin: body?.manufacturerOrigin,
      details: body?.manufacturerDetails,
    },
    paymentInfo: body?.paymentInformation || [],
    warranty: body?.warranty,
    bodyInfo: body?.bodyInfo || {},
    specification: body?.specification || {}
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
    status: body?.status
  }
}

module.exports = { product_listing_template_engine, productVariation };