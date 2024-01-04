const dbm = require("mongodb");
const { generateVerificationToken } = require("../utils/generator");
const Product_tbl = require("../model/PRODUCT_TBL");
const ProductVariation_tbl = require("../model/PRODUCT_VARIATION_TBL");

module.exports = class ProductService {
  async isProduct(productId: string, sku: string) {
    try {
      const variant = await ProductVariation_tbl.findOne({
        productId: dbm.ObjectId(productId),
        sku,
      });

      if (!variant) throw new Error("Service unavailable!");

      return { stockQuantity: variant?.stockQuantity, stock: variant?.stock, supplierId: variant?.supplierId };
    } catch (error: any) {
      throw new Error(`Error in isProduct: ${error?.message}`);
    }
  }
};
