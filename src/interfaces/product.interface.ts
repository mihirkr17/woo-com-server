export interface IProductVariationStockUpdate {
  sku: string;
  available: number;
}

export interface IUpdateProductStatusController {
  productId: string;
  statusValue: string;
}
