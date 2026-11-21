import { NextRequest, NextResponse } from "next/server";
import { getFilteredProducts } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const categories = searchParams.getAll("category");
  const categoryParam = searchParams.get("category");
  const category =
    categories.length > 1 ? categories : categoryParam || undefined;

  const price = searchParams.get("price") || undefined;
  const rating = searchParams.get("rating") || undefined;
  const sale = searchParams.get("sale") || undefined;
  const sort = searchParams.get("sort") || undefined;
  const q = searchParams.get("q") || undefined;

  const products = await getFilteredProducts({
    category,
    price,
    rating,
    sale,
    sort,
    q,
  });

  return NextResponse.json({
    products,
    total: products.length,
  });
}
