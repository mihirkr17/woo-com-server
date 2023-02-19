// common.services.tsx
const mdb = require("mongodb");
const Product = require("../model/product.model");

// Services
module.exports.updateProductVariationAvailability = async (
   productID: string,
   variationID: string,
   quantity: number,
   action: string
) => {

   const product = await Product.findOne({
      _id: mdb.ObjectId(productID)
   });

   if (product) {
      const targetVariation = product?.variations.filter((v: any) => v?._VID === variationID)[0];
      let available = targetVariation?.available;
      let restAvailable;

      if (action === "inc") {
         restAvailable = available + quantity;
      }
      if (action === "dec") {
         restAvailable = available - quantity;
      }

      let stock = restAvailable <= 1 ? "out" : "in";

      const result = await Product.updateOne({ _id: mdb.ObjectId(productID) }, {
         $set: {
            "variations.$[i].available": restAvailable,
            "variations.$[i].stock": stock
         }
      }, {
         arrayFilters: [{ 'i._VID': variationID }]
      });
   }
};
