import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import Category from "../src/model/Category";
import Product from "../src/model/Product";
import { slugify } from "../src/utlis/slugify";

const MONGODB_URI = process.env.MONGODB_URI as string;

interface SeedProduct {
  title: string;
  description: string;
  basePrice: number;
  variants?: { name: string; priceModifier: number }[];
  image: string;
}

interface SeedCategory {
  name: string;
  displayOrder: number;
  products: SeedProduct[];
}

const SEED_DATA: SeedCategory[] = [
  {
    name: "Deals",
    displayOrder: 1,
    products: [
      {
        title: "Family Deal",
        description: "2 burgers, fries, and a 1.5L drink — perfect for sharing.",
        basePrice: 1299,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500",
      },
    ],
  },
  {
    name: "Burgers",
    displayOrder: 2,
    products: [
      {
        title: "Zinger Burger",
        description: "Crispy fried chicken burger with special sauce.",
        basePrice: 450,
        variants: [
          { name: "Regular", priceModifier: 0 },
          { name: "Large", priceModifier: 150 },
        ],
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
      },
      {
        title: "Beef Burger",
        description: "Juicy beef patty with lettuce, cheese, and house sauce.",
        basePrice: 500,
        variants: [
          { name: "Regular", priceModifier: 0 },
          { name: "Large", priceModifier: 150 },
        ],
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
      },
    ],
  },
  {
    name: "Pizza",
    displayOrder: 3,
    products: [
      {
        title: "Chicken Tikka Pizza",
        description: "Loaded with spiced chicken tikka, onions, and mozzarella.",
        basePrice: 899,
        variants: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 300 },
        ],
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500",
      },
    ],
  },
  {
    name: "Pasta",
    displayOrder: 4,
    products: [
      {
        title: "Chicken Alfredo Pasta",
        description: "Creamy Alfredo sauce with grilled chicken chunks.",
        basePrice: 650,
        image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500",
      },
    ],
  },
  {
    name: "Appetizers & Starters",
    displayOrder: 5,
    products: [
      {
        title: "Garlic Bread",
        description: "Toasted bread topped with garlic, butter, and herbs.",
        basePrice: 100,
        image: "https://images.unsplash.com/photo-1573140401552-3fab0b24427f?w=500",
      },
      {
        title: "Spring Rolls",
        description: "Crispy fried rolls filled with vegetables.",
        basePrice: 350,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500",
      },
      {
        title: "Nachos",
        description: "Tortilla chips covered with melted cheese and salsa.",
        basePrice: 400,
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500",
      },
    ],
  },
  {
    name: "Chicken Karahi & BBQ",
    displayOrder: 6,
    products: [
      {
        title: "Chicken Karahi (Full)",
        description: "Spiced chicken cooked in a traditional wok-like iron pot.",
        basePrice: 1400,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500",
      },
    ],
  },
  {
    name: "Sides & Salads",
    displayOrder: 7,
    products: [
      {
        title: "French Fries",
        description: "Deep-fried crispy potato strips.",
        basePrice: 100,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500",
      },
      {
        title: "Caesar Salad",
        description: "Romaine lettuce with croutons, parmesan, and Caesar dressing.",
        basePrice: 350,
        image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500",
      },
      {
        title: "Naan / Roti",
        description: "Traditional flatbread baked in a tandoor oven.",
        basePrice: 40,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500",
      },
    ],
  },
  {
    name: "Beverages",
    displayOrder: 8,
    products: [
      {
        title: "Soft Drink (Can)",
        description: "Chilled Coke, Pepsi, Sprite, or Fanta.",
        basePrice: 100,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500",
      },
      {
        title: "Fresh Lemonade",
        description: "Freshly squeezed lemon with mint.",
        basePrice: 200,
        image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500",
      },
    ],
  },
  {
    name: "Desserts",
    displayOrder: 9,
    products: [
      {
        title: "Chocolate Brownie",
        description: "Rich chocolate cake square, served warm.",
        basePrice: 300,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500",
      },
      {
        title: "Gulab Jamun (2 pcs)",
        description: "Deep-fried milk solids soaked in sweet sugar syrup.",
        basePrice: 150,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500",
      },
    ],
  },
  {
    name: "Sandwiches",
    displayOrder: 10,
    products: [
      {
        title: "Club Sandwich",
        description: "Triple-layer sandwich with chicken, egg, and vegetables.",
        basePrice: 450,
        image: "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=500",
      },
    ],
  },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  for (const cat of SEED_DATA) {
    const slug = slugify(cat.name);

    let category = await Category.findOne({ slug });
    if (!category) {
      category = await Category.create({
        name: cat.name,
        slug,
        displayOrder: cat.displayOrder,
        isActive: true,
      });
      console.log(`✅ Created category: ${cat.name}`);
    } else {
      console.log(`↺ Category already exists: ${cat.name}`);
    }

    for (const prod of cat.products) {
      const existingProduct = await Product.findOne({ title: prod.title, category: category._id });
      if (existingProduct) {
        console.log(`   ↺ Product already exists: ${prod.title}`);
        continue;
      }

      await Product.create({
        title: prod.title,
        description: prod.description,
        category: category._id,
        basePrice: prod.basePrice,
        variants: prod.variants || [],
        image: prod.image,
        isAvailable: true,
      });
      console.log(`   ✅ Created product: ${prod.title} (Rs. ${prod.basePrice})`);
    }
  }

  console.log("\n🎉 Seeding complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
