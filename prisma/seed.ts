// Seeds the 6 categories, 10 products and 2 coupons from shopmate-prototype.html.
// Safe to re-run: everything is upserted by its unique key.
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const db = new PrismaClient({ adapter: new PrismaMariaDb(url) });

const img = (key: string) => `/images/products/${key}.jpg`;
const rupees = (n: number) => n * 100;
const PLACEHOLDER_STOCK = 50;

const categories = [
  { slug: "electronics", name: "Electronics", tint: "cat-blue", image: img("headphones") },
  { slug: "fashion", name: "Fashion", tint: "cat-rose", image: img("tshirt") },
  { slug: "home", name: "Home & Kitchen", tint: "cat-butter", image: img("armchair") },
  { slug: "beauty", name: "Beauty", tint: "cat-lilac", image: img("serum") },
  { slug: "sports", name: "Sports", tint: "cat-mint", image: img("sneakers") },
  { slug: "accessories", name: "Accessories", tint: "cat-peach", image: img("smartwatch") },
];

type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  count: number;
  price: number; // rupees
  mrp: number; // rupees
  best?: boolean;
  description: string;
  option: { name: string; values: string[] } | null;
  highlights: string[];
  specs: [string, string][];
};

const products: SeedProduct[] = [
  {
    slug: "smart-watch-series-5", name: "Smart Watch Series 5", category: "accessories", image: "smartwatch",
    rating: 4.5, count: 126, price: 4999, mrp: 7499, best: true,
    description: "Track your day at a glance. A bright round display, all-day heart-rate and sleep tracking, and a battery that lasts up to 7 days.",
    option: { name: "Strap", values: ["Cloud White", "Graphite", "Sage"] },
    highlights: ["Crisp 1.3\" AMOLED display, readable in full sun", "Heart rate, SpO2, sleep and 100+ workout modes", "Up to 7 days of battery; full charge in 90 minutes", "Water resistant to 5 ATM", "Works with iPhone and Android"],
    specs: [["Display", "1.3\" AMOLED, 416 × 416"], ["Battery", "Up to 7 days"], ["Water resistance", "5 ATM"], ["Strap", "Silicone, 20 mm quick-release"], ["Warranty", "1 year"], ["In the box", "Watch, magnetic charger, guide"]],
  },
  {
    slug: "wireless-headphones", name: "Wireless Headphones", category: "electronics", image: "headphones",
    rating: 4.7, count: 98, price: 2999, mrp: 4499, best: true,
    description: "Big sound in a light, foldable frame. Soft memory-foam cushions and 40 hours of playback make these an everyday favourite.",
    option: { name: "Colour", values: ["Graphite", "Sand", "Olive"] },
    highlights: ["40 mm drivers with deep, balanced bass", "Up to 40 hours of wireless playback", "10-minute quick charge gives 4 hours of listening", "Fold-flat design with memory-foam cushions", "Built-in mic for calls; 3.5 mm cable included"],
    specs: [["Driver", "40 mm dynamic"], ["Battery", "Up to 40 hours"], ["Connectivity", "Bluetooth 5.3, 3.5 mm wired"], ["Charging", "USB-C"], ["Warranty", "1 year"], ["In the box", "Headphones, USB-C cable, audio cable, pouch"]],
  },
  {
    slug: "travel-backpack", name: "Travel Backpack", category: "accessories", image: "backpack",
    rating: 4.6, count: 156, price: 1999, mrp: 2999, best: true,
    description: "One bag for the commute and the weekend away. A padded laptop sleeve, quick-grab pockets and water-repellent fabric keep everything sorted.",
    option: { name: "Colour", values: ["Navy", "Olive", "Charcoal"] },
    highlights: ["Padded sleeve fits laptops up to 15.6\"", "Water-repellent recycled polyester", "Hidden back pocket for passport and cards", "Luggage strap slides over suitcase handles", "Breathable mesh back panel"],
    specs: [["Capacity", "24 L"], ["Dimensions", "46 × 31 × 17 cm"], ["Laptop sleeve", "Up to 15.6\""], ["Material", "Recycled polyester"], ["Warranty", "2 years"]],
  },
  {
    slug: "running-shoes", name: "Running Shoes", category: "sports", image: "sneakers",
    rating: 4.4, count: 78, price: 2499, mrp: 3999, best: true,
    description: "Light, springy and made for daily miles. A cushioned foam midsole and breathable knit upper keep every run comfortable.",
    option: { name: "Size (UK/IN)", values: ["6", "7", "8", "9", "10", "11"] },
    highlights: ["Responsive foam midsole for soft landings", "Breathable engineered-knit upper", "Grippy rubber outsole for road and track", "Padded collar and heel tab", "Removable insole"],
    specs: [["Upper", "Engineered knit"], ["Midsole", "EVA foam"], ["Outsole", "Rubber"], ["Drop", "8 mm"], ["Fit", "True to size"]],
  },
  {
    slug: "luxury-perfume", name: "Luxury Perfume", category: "beauty", image: "perfume",
    rating: 4.8, count: 64, price: 1499, mrp: 2499, best: true,
    description: "A warm, amber fragrance with notes of vanilla, sandalwood and a touch of citrus. Long-lasting and easy to wear day or night.",
    option: { name: "Size", values: ["50 ml", "100 ml"] },
    highlights: ["Top notes: bergamot, mandarin", "Heart notes: jasmine, orange blossom", "Base notes: vanilla, sandalwood, amber", "Eau de parfum strength, lasts 6–8 hours", "Gift-ready box"],
    specs: [["Concentration", "Eau de parfum"], ["Fragrance family", "Amber, floral"], ["Longevity", "6–8 hours"], ["Volume", "50 ml or 100 ml"]],
  },
  {
    slug: "everyday-cotton-tee", name: "Everyday Cotton Tee", category: "fashion", image: "tshirt",
    rating: 4.3, count: 212, price: 599, mrp: 999,
    description: "The tee you'll reach for first. Soft, mid-weight cotton with a relaxed fit that holds its shape wash after wash.",
    option: { name: "Size", values: ["XS", "S", "M", "L", "XL"] },
    highlights: ["100% combed organic cotton, 180 gsm", "Relaxed fit with a classic crew neck", "Pre-shrunk, so it keeps its size", "Machine washable"],
    specs: [["Material", "100% organic cotton"], ["Weight", "180 gsm"], ["Fit", "Relaxed"], ["Care", "Machine wash cold"]],
  },
  {
    slug: "tufted-accent-chair", name: "Tufted Accent Chair", category: "home", image: "armchair",
    rating: 4.6, count: 41, price: 8999, mrp: 12999,
    description: "A plush, button-tufted chair that brings a soft, classic touch to any corner. Turned legs and a curved back make it as pretty as it is comfortable.",
    option: { name: "Upholstery", values: ["Ivory", "Sage", "Oat"] },
    highlights: ["Hand-tufted velvet-touch upholstery", "Solid beech wood turned legs", "High-density foam seat", "Arrives assembled; just attach the legs"],
    specs: [["Dimensions", "W 70 × D 68 × H 78 cm"], ["Seat height", "45 cm"], ["Frame", "Solid beech"], ["Max load", "120 kg"]],
  },
  {
    slug: "botanical-face-serum", name: "Botanical Face Serum", category: "beauty", image: "serum",
    rating: 4.7, count: 88, price: 799, mrp: 1199,
    description: "A lightweight daily serum with botanical extracts and hyaluronic acid to hydrate, brighten and smooth.",
    option: { name: "Size", values: ["30 ml", "50 ml"] },
    highlights: ["Hyaluronic acid for deep hydration", "Niacinamide to even out tone", "Fragrance-free, suitable for sensitive skin", "Use morning and night before moisturiser"],
    specs: [["Volume", "30 ml or 50 ml"], ["Skin type", "All, including sensitive"], ["Key ingredients", "Hyaluronic acid, niacinamide, green tea"]],
  },
  {
    slug: "kraft-canvas-tote", name: "Kraft Canvas Tote", category: "fashion", image: "tote",
    rating: 4.5, count: 57, price: 699, mrp: 999,
    description: "A sturdy everyday tote in kraft-coloured canvas. Roomy enough for groceries, books and a laptop.",
    option: null,
    highlights: ["Heavy cotton canvas with reinforced handles", "Fits a 14\" laptop", "Inner zip pocket for keys and cards", "Folds flat for storage"],
    specs: [["Dimensions", "40 × 38 × 12 cm"], ["Material", "12 oz cotton canvas"], ["Care", "Spot clean"]],
  },
  {
    slug: "mini-succulent-pot", name: "Mini Succulent Pot", category: "home", image: "plant",
    rating: 4.9, count: 133, price: 399, mrp: 599,
    description: "A low-maintenance succulent in a matte ceramic pot. A little greenery for your desk or windowsill, no green thumb needed.",
    option: { name: "Pot colour", values: ["Mint", "White", "Sand"] },
    highlights: ["Live haworthia succulent, 10–15 cm tall", "Matte ceramic pot with drainage hole", "Water every 2–3 weeks", "Ships in plant-safe packaging"],
    specs: [["Plant", "Haworthia"], ["Height", "10–15 cm"], ["Pot", "Ceramic, 9 cm"], ["Light", "Bright, indirect"]],
  },
];

// Products without options get a single default variant so cart lines always point at a variant.
const DEFAULT_VARIANT = "Standard";
const sku = (slug: string, value: string) =>
  `${slug}-${value}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-");

async function main() {
  const catIds = new Map<string, string>();
  for (const c of categories) {
    const row = await db.category.upsert({ where: { slug: c.slug }, update: c, create: c });
    catIds.set(c.slug, row.id);
  }

  for (const p of products) {
    const data = {
      name: p.name,
      description: p.description,
      highlights: p.highlights,
      specs: p.specs.map(([label, value]) => ({ label, value })),
      categoryId: catIds.get(p.category)!,
      images: [img(p.image)],
      pricePaise: rupees(p.price),
      mrpPaise: rupees(p.mrp),
      ratingAvg: p.rating,
      ratingCount: p.count,
      optionName: p.option?.name ?? null,
      isBestSeller: p.best ?? false,
    };
    const row = await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });

    for (const value of p.option?.values ?? [DEFAULT_VARIANT]) {
      const code = sku(p.slug, value);
      await db.variant.upsert({
        where: { sku: code },
        update: { value, stock: PLACEHOLDER_STOCK },
        create: { productId: row.id, value, sku: code, stock: PLACEHOLDER_STOCK },
      });
    }
  }

  const coupons = [
    { code: "WELCOME10", type: "percent", value: 10, maxDiscountPaise: rupees(500), minOrderPaise: 0, isActive: true },
    { code: "SAVE200", type: "flat", value: rupees(200), maxDiscountPaise: null, minOrderPaise: rupees(1999), isActive: true },
  ];
  for (const c of coupons) {
    await db.coupon.upsert({ where: { code: c.code }, update: c, create: c });
  }

  console.log(`Seeded ${categories.length} categories, ${products.length} products, ${coupons.length} coupons.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
