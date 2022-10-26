const productUpdateModel = (body: any) => {
  let stock: String;
  let available = parseInt(body?.available) || 0;

  if (available && available >= 1) {
    stock = "in";
  } else {
    stock = "out";
  }

  return {
    attr: {
      size: body?.size || [],
      color: body?.color || [],
      material: body?.material || []
    },
    brand: body?.brand || '',
    bodyInfo: {
      description: body?.description || "",
      metaDescription: body?.metaDescription || "",
      specification: body?.specification || [],
    },
    pricing: {
      price: parseFloat(body?.price),
      sellingPrice: parseFloat(body.sellingPrice),
      discount: parseInt(body?.discount),
      currency: "BDT"
    },
    stockInfo: {
      stock,
      available
    },
    categories: [body?.category, body?.subCategory, body?.postCategory] || [],
    packageInfo: {
      inTheBox: body?.inTheBox || "",
      dimension: {
        weight: parseFloat(body?.packageWeight || 0),
        length: parseFloat(body?.packageLength || 0),
        width: parseFloat(body?.packageWidth || 0),
        height: parseFloat(body?.packageHeight || 0),
      },
      unit: 'cm'
    },
    variations: body?.variations,
    warranty: {
      wType: body?.warrantyType,
      wTime: body?.warrantyTime,
    },
    paymentInfo: body?.paymentInfo || [],
    sku: body?.sku || "",
    status: body?.status || "",
    modifiedAt: new Date(Date.now()),
  };
};

const productIntroTemplate = (body: any) => {
  return {
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
      localDeliveryCharge: body?.localDeliveryCharge,
      zonalDeliveryCharge: body?.zonalDeliveryCharge,
      nationalDeliveryCharge: body?.nationalDeliveryCharge
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

const productRatingTemplate = () => {
  return {
    rating: [
      { weight: 5, count: 0 },
      { weight: 4, count: 0 },
      { weight: 3, count: 0 },
      { weight: 2, count: 0 },
      { weight: 1, count: 0 },
    ],
    ratingAverage: 0,
  }
}

const productImagesModel = (body: any) => {
  return {
    images: body?.images || [],
  }
}


const variationOneTemplate = (body: any) => {
  let available = parseInt(body?.available);
  let stock;

  if (available && available >= 1) {
    stock = "in";
  } else {
    stock = "out";
  }

  return {
    title: body?.title,
    slug: body?.slug,
    images: body?.images,
    sku: body?.sku,
    pricing: {
      price: parseFloat(body?.price),
      sellingPrice: parseFloat(body?.sellingPrice),
      discount: body?.discount,
      currency: 'BDT'
    },
    stock,
    available: parseInt(body?.available),
    status: body?.status,
    modifiedAt: new Date(Date.now())
  }
}

module.exports = { productUpdateModel, productIntroTemplate, productImagesModel, variationOneTemplate, productRatingTemplate };