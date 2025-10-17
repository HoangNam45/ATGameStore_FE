import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/firebaseClient";

export async function GET() {
  try {
    const products = await getAllProducts();

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
