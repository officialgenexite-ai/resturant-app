import { Product, ProductVariant } from "./menu.types";

export interface CartLineItem {
  lineId: string;          // productId + variantName combo, unique per line
  productId: string;
  title: string;
  image: string;
  variantName: string | null; // null if product has no variants
  unitPrice: number;          // basePrice + variant.priceModifier (or just basePrice)
  quantity: number;
}
