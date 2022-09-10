import { Request, Response } from "express";
const { dbh, dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { productModel, productUpdateModel } = require("../../model/product");

module.exports.searchProducts = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const q = req.params.q;
    const searchQuery = (sTxt: string) => {
      let findProduct: any = {
        $or: [
          { title: { $regex: sTxt, $options: "i" } },
          { seller: { $regex: sTxt, $options: "i" } },
          { brand: { $regex: sTxt, $options: "i" } },
          { "genre.category": { $regex: sTxt, $options: "i" } },
        ],
      };
      return findProduct;
    };

    const result = await db
      .collection("products")
      .find(searchQuery(q))
      .toArray();
    res.status(200).send(result);
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.topRatedProducts = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    res
      .status(200)
      .send(
        await db
          .collection("products")
          .find({ status: "active" })
          .sort({ rating_average: -1 })
          .limit(6)
          .toArray()
      );
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.topSellingProducts = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    res
      .status(200)
      .send(
        await db
          .collection("products")
          .find({ status: "active" })
          .sort({ top_sell: -1 })
          .limit(6)
          .toArray()
      );
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.countProducts = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const seller = req.query.seller;
    let result = await db
      .collection("products")
      .countDocuments(seller && { seller: seller });
    res.status(200).send({ count: result });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.deleteProducts = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const productId: string = req.params.productId;
    const result = await db.collection("products").deleteOne({
      _id: ObjectId(productId),
    });

    if (result) {
      await db
        .collection("users")
        .updateMany(
          { "myCartProduct._id": productId },
          { $pull: { myCartProduct: { _id: productId } } }
        );
      return res.status(200).send({ message: "Product deleted successfully." });
    } else {
      return res.status(503).send({ message: "Service unavailable" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.updateProduct = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const productId = req.params.productId;
    const body = req.body;
    const model = productUpdateModel(body);

    const exists =
      (await db
        .collection("users")
        .find({ "myCartProduct._id": productId })
        .toArray()) || [];

    if (exists && exists.length > 0) {
      await db.collection("users").updateMany(
        { "myCartProduct._id": productId },
        {
          $pull: { myCartProduct: { _id: productId } },
        }
      );
    }

    const result = await db
      .collection("products")
      .updateOne(
        { _id: ObjectId(productId) },
        { $set: model },
        { upsert: true }
      );

    res.status(200).send(result && { message: "Product updated successfully" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.updateStock = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const productId = req.headers.authorization;
    const body = req.body;

    let stock = body?.available <= 1 ? "out" : "in";

    if (productId && body) {
      const result = await db
        .collection("products")
        .updateOne(
          { _id: ObjectId(productId) },
          { $set: { available: body?.available, stock } },
          { upsert: true }
        );

      res.status(200).send(result);
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.addProductHandler = async (req: Request, res: Response) => {
  const body = req.body;
  try {
    const db = await dbConnection();

    const model = productModel(body);
    await db.collection("products").insertOne(model);
    res.status(200).send({ message: "Product added successfully" });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};

module.exports.allProducts = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();
    const totalLimits = parseInt(req.params.limits);

    const result = await db
      .collection("products")
      .find({ status: "active" })
      .sort({ _id: -1 })
      .limit(totalLimits)
      .toArray();

    return result
      ? res.status(200).send(result)
      : res.status(500).send({ success: false, error: "Something went wrong" });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};

module.exports.fetchSingleProduct = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const email = req.query.email;
    const product_slug = req.params.product_slug;
    let inCart: boolean;
    let inWishlist: boolean;

    let result = await db.collection("products").findOne({
      slug: product_slug,
      status: "active",
    });

    if (!result) {
      return res
        .status(400)
        .send({ success: false, error: "Product not found!" });
    }

    if (email) {
      const existProductInCart = await db
        .collection("users")
        .findOne({ email: email, "myCartProduct.slug": product_slug });
        

      const existProductInWishlist = await db.collection("users").findOne(
        { email: email, "wishlist.slug": product_slug},
        // { "wishlist.$": 1 }
      );

      if (existProductInWishlist) {
        inWishlist = true;
      } else {
        inWishlist = false;
      }

      if (existProductInCart && typeof existProductInCart === "object") {
        inCart = true;
      } else {
        inCart = false;
      }
      result["inCart"] = inCart;
      // result["policy"] = policy;
      result["inWishlist"] = inWishlist;
    }

    return res.status(200).send(result);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};

module.exports.fetchSingleProductByPid = async (
  req: Request,
  res: Response
) => {
  try {
    const db = await dbConnection();

    const productId = req.query.pid;
    const seller = req.query.seller;
    return res.status(200).send(
      await db.collection("products").findOne({
        _id: ObjectId(productId),
        seller: seller,
      })
    );
  } catch (error: any) {
    return res.status(500).send({ message: error?.message });
  }
};

module.exports.productByCategory = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    let findQuery: any;
    const productCategory = req.query.category;
    const productSubCategory = req.query.sb_category;
    const productPostCategory = req.query.pt_category;
    const filters = req.query.filters;
    let sorting;

    if (filters) {
      if (filters === "lowest") {
        sorting = { price_fixed: 1 };
      } else if (filters === "highest") {
        sorting = { price_fixed: -1 };
      } else {
        sorting = {};
      }
    }

    if (productCategory) {
      findQuery = {
        "genre.category": productCategory,
        status: "active",
      };
    }

    if (productCategory && productSubCategory) {
      findQuery = {
        "genre.category": productCategory,
        "genre.sub_category": productSubCategory,
        status: "active",
      };
    }

    if (productCategory && productSubCategory && productPostCategory) {
      findQuery = {
        "genre.category": productCategory,
        "genre.sub_category": productSubCategory,
        "genre.post_category": productPostCategory,
        status: "active",
      };
    }

    const tt = await db
      .collection("products")
      .find(findQuery, { price_fixed: { $exists: 1 } })
      .sort(sorting)
      .toArray();
    return tt
      ? res.status(200).send(tt)
      : res.status(500).send({ success: false, error: "Something went wrong" });
  } catch (error: any) {
    return res.status(500).send({ message: error?.message });
  }
};

module.exports.fetchTopSellingProduct = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const seller: any = req.query.seller;
    let filterQuery: any = {
      status: "active",
    };
    if (seller) {
      filterQuery["seller"] = seller;
    }

    const result = await db
      .collection("products")
      .find(filterQuery)
      .sort({ top_sell: -1 })
      .limit(6)
      .toArray();
    res.status(200).send(result);
  } catch (error: any) {
    return res.status(500).send({ message: error?.message });
  }
};

module.exports.manageProduct = async (req: Request, res: Response) => {
  const db = await dbConnection();

  let item: any;
  let page: any;
  let seller_name: any = req.query.seller;
  item = req.query.items;
  page = req.query.page;
  let searchText: any = req.query.search;
  let filters: any = req.query.category;
  let cursor: any;
  let result: any;

  const searchQuery = (sTxt: string, seller_name: string = "") => {
    item = "";
    page = "";
    let findProduct: any = {
      $or: [
        { title: { $regex: sTxt, $options: "i" } },
        { seller: { $regex: sTxt, $options: "i" } },
      ],
    };
    if (seller_name) {
      findProduct["seller"] = seller_name;
    }
    return findProduct;
  };

  const filterQuery = (category: string, seller_name: string = "") => {
    item = "";
    page = "";
    let findProduct: any = {
      "genre.category": category,
    };
    if (seller_name) {
      findProduct["seller"] = seller_name;
    }
    return findProduct;
  };

  page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

  try {
    cursor =
      searchText && searchText.length > 0
        ? db
            .collection("products")
            .find(searchQuery(searchText, seller_name || ""))
        : filters && filters !== "all"
        ? db
            .collection("products")
            .find(filterQuery(filters, seller_name || ""))
        : db
            .collection("products")
            .find((seller_name && { seller: seller_name }) || {});

    if (item || page) {
      result = await cursor
        .skip(page * parseInt(item))
        .limit(parseInt(item))
        .toArray();
    } else {
      result = await cursor.toArray();
    }

    return result
      ? res.status(200).send(result)
      : res.status(200).send({ success: false, error: "Something went wrong" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};