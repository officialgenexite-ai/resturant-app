export interface Category {
  _id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductVariant {
  name: string;
  priceModifier: number;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  category: Category | string; // populated object from backend, or just an id
  basePrice: number;
  variants: ProductVariant[];
  image: string;
  isAvailable: boolean;
}

export interface MenuCache {
  categories: Category[];
  products: Product[];
  cachedAt: number; // Date.now() timestamp
}
