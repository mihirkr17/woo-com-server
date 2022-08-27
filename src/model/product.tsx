const productModel = (body: any) => {
  let stock: string;
  let available = body?.available || 0;

  if (available && available >= 1) {
    stock = "in";
  } else {
    stock = "out";
  }
  return {
    title: body?.title || "",
    slug: body?.slug || "",
    brand: body?.brand || "",
    image: body?.images || [],
    info: {
      description: body?.description || "",
      short_description: body?.short_description || "",
      specification: body?.specification || "",
      size: body?.size || [],
    },
    pricing: body?.pricing || {},
    available: parseInt(body?.available || 0),
    stock,
    package_dimension: {
      weight: parseFloat(body?.packageWeight || 0),
      length: parseFloat(body?.packageLength || 0),
      width: parseFloat(body?.packageWidth || 0),
      height: parseFloat(body?.packageHeight || 0),
    },
    delivery_service: {
      in_box: body?.inBox || "",
      warrantyType: body?.warrantyType || "",
      warrantyTime: body?.warrantyTime || "",
    },
    payment_option: body?.payment_option || [],
    sku: body?.sku || "",
    status: body?.status || "",
    save_as: "fulfilled",

    genre: {
      category: body?.category || "", // category
      sub_category: body?.subCategory || "", // sub category
      post_category: body?.postCategory || "", // third category
    },
    seller: body?.seller || "unknown",
    rating: [
      { weight: 5, count: 0 },
      { weight: 4, count: 0 },
      { weight: 3, count: 0 },
      { weight: 2, count: 0 },
      { weight: 1, count: 0 },
    ],
    rating_average: 0,
    createAt: new Date(Date.now()),
  };
};

const productUpdateModel = (body: any) => {
  let stock: string;
  let available = body?.available || 0;

  if (available && available >= 1) {
    stock = "in";
  } else {
    stock = "out";
  }
  return {
    title: body?.title || "",
    slug: body?.slug || "",
    image: body?.images || [],
    info: {
      description: body?.description || "",
      short_description: body?.short_description || "",
      specification: body?.specification || "",
      size: body?.size || [],
    },
    pricing: body?.pricing || {},
    available,
    stock,
    package_dimension: {
      weight: parseFloat(body?.packageWeight || 0),
      length: parseFloat(body?.packageLength || 0),
      width: parseFloat(body?.packageWidth || 0),
      height: parseFloat(body?.packageHeight || 0),
    },
    delivery_service: {
      in_box: body?.inBox || "",
      warrantyType: body?.warrantyType || "",
      warrantyTime: body?.warrantyTime || "",
    },
    payment_option: body?.payment_option || [],
    sku: body?.sku || "",
    status: body?.status || "",
    save_as: "fulfilled",
    modifiedAt: new Date(Date.now()),
  };
};

module.exports = { productModel, productUpdateModel };
