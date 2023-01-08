const productIntroTemplate = (body: any) => {
  return {
    title: body?.title,
    slug: body?.slug,
    save_as: 'draft',
    categories: [body?.category, body?.subCategory, body?.postCategory] || [],
    brand: body?.brand,
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
    paymentInfo: body?.paymentInformation,
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
    status: body?.status
  }
}

module.exports = { productIntroTemplate, productVariation };