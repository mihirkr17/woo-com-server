import { Request, Response } from "express";
var { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const {
   productCounter,
   topSellingProducts,
   topRatedProducts,
   allProducts
} = require("../../model/product.model");

/**
 * @controller      --> Fetch the single product information in product details page.
 * @required        --> [req.headers.authorization:email, req.query:productId, req.query:variationId, req.params:product slug]
 * @request_method  --> GET
 */
module.exports.fetchSingleProductController = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const email: String = req.headers.authorization || '';
      const product_slug: String = req.params.product_slug;
      const productId = req.query?.pId;
      const variationId = req.query.vId;
      let inCart: boolean = false;
      let inWishlist: boolean = false;

      let colors = req.query.colors;
      let size = req.query.size;

      // Product Details
      let productDetail = await db.collection('products').aggregate([
         { $match: { _id: ObjectId(productId) } },
         {
            $project: {
               title: 1,
               slug: 1,
               variations: '$variations', swatch: "$variations",
               specification: '$specification',
               brand: 1, categories: 1,
               seller: 1, rating: 1, ratingAverage: 1, save_as: 1, createdAt: 1, bodyInfo: 1, manufacturer: 1,
               _lId: 1
            }
         },
         { $unwind: { path: '$variations' } },
         { $match: { 'variations._vId': variationId } }
      ]).toArray();


      productDetail = productDetail[0];

      // Related products
      const relatedProducts = await db.collection("products").aggregate([
         { $unwind: { path: '$variations' } },
         {
            $match: {
               $and: [
                  { categories: { $in: productDetail.categories } },
                  { 'variations._vId': { $ne: variationId } },
                  { 'variations.status': "active" },
               ],
            },
         },
         {
            $project: {
               _lId: 1,
               ratingAverage: "$ratingAverage",
               brand: "$brand",
               variations: {
                  _vId: "$variations._vId",
                  pricing: "$variations.pricing",
                  title: "$variations.title",
                  slug: "$variations.slug",
                  attributes: "$variations.attributes",
                  images: "$variations.images"
               },
               reviews: 1,
            },
         },
         { $limit: 5 },
      ]).toArray();

      // If user email address exists
      if (email) {
         const existProductInCart = await db
            .collection("shoppingCarts")
            .findOne({ $and: [{ customerEmail: email }, { _vId: variationId }] });

         const existProductInWishlist = await db
            .collection("users")
            .findOne({ $and: [{ email }, { "wishlist.slug": product_slug }] });

         if (existProductInWishlist) {
            inWishlist = true;
         }

         if (existProductInCart && typeof existProductInCart === "object") {
            inCart = true;
         }

         productDetail["inCart"] = inCart;

         productDetail["inWishlist"] = inWishlist;
      }

      return res.status(200).send({
         success: true,
         statusCode: 200,
         data: { product: productDetail, relatedProducts },
      });

   } catch (error: any) {
      return res.status(500).send({ success: false, statusCode: 500, error: error.message });
   }
};




/**
 * @controller      --> productsByCategoryController
 * @required        --> categories [Optional -> filters query]
 */
module.exports.productsByCategoryController = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const { categories, filters } = req.query;

      let category: String[] =
         (categories && categories.toString().split(",")) || [];

      let sorting = {};

      if (filters && filters === "lowest") {
         sorting = { $sort: { "variations.pricing.sellingPrice": 1 } };
      } else if (filters && filters === "highest") {
         sorting = { $sort: { "variations.pricing.sellingPrice": -1 } }
      } else {
         sorting = { $sort: { "variations.modifiedAt": 1 } }
      }


      const products = await db.collection("products").aggregate([
         { $unwind: { path: '$variations' } },
         {
            $match: {
               $and: [
                  { categories: { $all: category } },
                  { 'variations.status': "active" }
               ]
            }
         },
         sorting
      ]).toArray();


      //   .find({
      //   $and: [
      //     { categories: { $all: category } },
      //     { status: "active" },
      //     { save_as: "fulfilled" },
      //   ],
      // })
      // .sort(sorting)
      // .toArray()) || [];

      return products
         ? res.status(200).send(products)
         : res.status(404).send({
            success: false,
            statusCode: 404,
            error: "Products not available.",
         });
   } catch (error: any) {
      return res
         .status(500)
         .send({ success: false, statusCode: 500, error: error?.message });
   }
};



/**
* @controller      --> Fetch the single product in product edit page.
* @required        --> [req.query:seller, req.query:productId, req.query:variationId]
* @request_method  --> GET
*/
module.exports.fetchSingleProductByPidController = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const productId = req.query.pid;
      const variationId = req.query.vId;
      const seller = req.query.seller;

      let product;

      if (variationId) {
         product = await db.collection('products').aggregate([
            {
               $match: { $and: [{ _id: ObjectId(productId) }, { save_as: "draft" }] }
            },
            {
               $unwind: { path: "$variations" },
            },
            {
               $match: { 'variations._vId': variationId }
            }
         ]).toArray();
         product = product[0];
      } else {
         product = await db.collection("products").findOne({
            $and: [{ _id: ObjectId(productId) }, { "seller.name": seller }],
         });
      }

      return product
         ? res.status(200).send(product)
         : res.status(404).send({
            success: false,
            statusCode: 404,
            error: "Product not found!!!",
         });
   } catch (error: any) {
      return res.status(500).send({ message: error?.message });
   }
};





module.exports.searchProducts = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const q = req.params.q;

      const result =
         (await db
            .collection("products")
            .aggregate([
               {
                  $match: {
                     $and: [{ status: "active" }, { save_as: "fulfilled" }],
                     $or: [
                        { title: { $regex: q, $options: "i" } },
                        { "seller.name": { $regex: q, $options: "i" } },
                        { brand: { $regex: q, $options: "i" } },
                        { categories: { $in: [q] } },
                     ],
                  },
               },
               {
                  $project: {
                     title: "$title",
                     categories: "$categories",
                     images: "$images",
                  },
               },
            ])
            .toArray()) || [];

      return result.length > 0
         ? res.status(200).send(result)
         : res.status(204).send();
   } catch (error: any) {
      res
         .status(500)
         .send({ success: false, statusCode: 500, error: error?.message });
   }
};





/**
 * @apiName --> count products
 * @required --> Optional (If count by seller then pass the seller query on url)
 */
module.exports.countProductsController = async (
   req: Request,
   res: Response
) => {
   try {
      const seller = req.query.seller;
      let result: any;

      if (seller) {
         result = await productCounter(seller);
      } else {
         result = await productCounter();
      }

      res.status(200).send({ success: true, statusCode: 200, count: result });
   } catch (error: any) {
      console.log(error?.message);
      res
         .status(500)
         .send({ success: false, statusCode: 500, error: error?.message });
   }
};




/**
 * @controller      --> Home store controller.
 * @required        --> []
 * @request_method  --> GET
 */
module.exports.homeStoreController = async (req: Request, res: Response) => {
   try {
      const totalLimits = parseInt(req.params.limits);

      const products = await allProducts(totalLimits);

      const topSellingProduct = await topSellingProducts();

      const topRatedProduct = await topRatedProducts();

      return res.status(200).send({
         success: true, statusCode: 200, data: {
            store: products,
            topSellingProducts: topSellingProduct,
            topRatedProducts: topRatedProduct
         }
      });


   } catch (error: any) {
      return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
}






// Dashboard Overview Controller
module.exports.dashboardOverviewController = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const authEmail: String = req.decoded.email;
      const role: String = req.decoded.role;

      let topSellers: any;
      let topSoldProducts: any;
      let matches: any;

      const user = await db.collection("users").findOne({ $and: [{ email: authEmail }, { role }] });

      if (user?.role === 'seller') {
         matches = { $match: { $and: [{ 'seller.name': user?.username }, { 'stockInfo.sold': { $exists: true } }] } }
      }

      if (user?.role === "admin") {

         topSellers = await db.collection('users').aggregate([
            { $match: { role: "seller" } },
            {
               $project: {
                  totalSell: '$inventoryInfo.totalSell',
                  username: '$username',
                  email: '$email',
                  totalProducts: '$inventoryInfo.totalProducts',
               }
            },
            { $sort: { totalSell: -1 } },
            { $limit: 10 }
         ]).toArray();

         matches = { $match: { 'stockInfo.sold': { $exists: true } } }
      }

      topSoldProducts = await db.collection('products').aggregate([
         matches,
         {
            $project: {
               sold: '$stockInfo.sold',
               images: '$images',
               title: '$title',
               seller: '$seller.name',
               sku: '$sku',
               brand: '$brand',
               categories: '$categories',
               pricing: '$pricing'
            }
         },
         { $sort: { sold: -1 } },
         { $limit: 10 }
      ]).toArray();



      return res.status(200).send({ success: true, statusCode: 200, data: { topSellers, topSoldProducts } });

   } catch (error: any) {
      return res
         .status(500)
         .send({ success: false, statusCode: 500, error: error?.message });
   }
};



module.exports.manageProductController = async (
   req: Request,
   res: Response
) => {
   try {
      const db = await dbConnection();

      const authEmail = req.decoded.email;
      const role = req.decoded.role;

      const isSeller = await db
         .collection("users")
         .findOne({ $and: [{ email: authEmail }, { role }] });

      let item: any;
      let page: any;
      item = req.query.items;
      page = req.query.page;
      let searchText: any = req.query.search;
      let filters: any = req.query.category;
      let cursor: any;
      let products: any;
      let draftProducts: any;
      let inactiveProduct: any;

      let showFor: any[];

      if (isSeller.role === "seller") {
         showFor = [
            { "seller.name": isSeller?.username },
            { 'variations.status': "active" },
            { save_as: "fulfilled" },
         ];
      } else {
         showFor = [{ 'variations.status': "active" }, { save_as: "fulfilled" }];
      }

      const searchQuery = (sTxt: String) => {
         item = "";
         page = "";
         return {
            $and: showFor,
            $or: [
               { title: { $regex: sTxt, $options: "i" } },
               { "seller.name": { $regex: sTxt, $options: "i" } },
            ],
         };
      };



      const filterQuery = (category: String) => {
         item = "";
         page = "";
         return {
            $and: [
               { categories: { $all: [category] } },
               { 'variations.status': "active" },
               { save_as: "fulfilled" },
            ],
         };
      };

      page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

      // cursor =
      //    searchText && searchText.length > 0
      //       ? db.collection("products").find(searchQuery(searchText))
      //       : filters && filters !== "all"
      //          ? db.collection("products").find(filterQuery(filters))
      //          : db.collection("products").find({ $and: showFor });


      // if (item || page) {
      //    products = await cursor
      //       .skip(page * parseInt(item))
      //       .limit(parseInt(item))
      //       .toArray();
      // } else {
      //    products = await cursor.toArray();
      // }

      products = await db.collection("products").aggregate([
         { $unwind: { path: '$variations' } },
         {
            $match: {
               $and: showFor,
               $or: [
                  { title: { $regex: searchText, $options: "i" } },
                  { "seller.name": { $regex: searchText, $options: "i" } },
                  { categories: { $all: [filters] } }
               ]
            }
         },
         {
            $skip: page * parseInt(item)
         }, {
            $limit: (parseInt(item))
         }
      ]).toArray();

      if (isSeller) {

         // draftProducts = await db.collection('products').aggregate([
         //   {
         //     $match: { $and: [{ "seller.name": isSeller?.username }, { save_as: "draft" }] }
         //   },
         //   {
         //     $unwind: { path: "$variations" },
         //   }
         // ]).toArray();

         draftProducts = await db
            .collection("products")
            .find({
               $and: [{ "seller.name": isSeller?.username }, { save_as: "draft" }],
            })
            .toArray();

         inactiveProduct = await db.collection("products").aggregate([
            { $unwind: { path: "$variations" } },
            { $match: { $and: [{ "seller.name": isSeller?.username }, { "variations.status": 'inactive' }] } }
         ]).toArray();
      }

      return res.status(200).send({
         success: true,
         statusCode: 200,
         data: { products, draftProducts, inactiveProduct },
      });
   } catch (error: any) {
      return res
         .status(500)
         .send({ success: false, statusCode: 500, error: error?.message });
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
         .sort({ "stockInfo.sold": -1 })
         .limit(6)
         .toArray();
      res.status(200).send(result);
   } catch (error: any) {
      return res.status(500).send({ message: error?.message });
   }
};