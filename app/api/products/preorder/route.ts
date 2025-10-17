import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/firebaseClient";

export async function GET() {
  try {
    const allProducts = await getAllProducts();
    const preorderProducts = allProducts.filter(
      (product) => product.type === "preorder"
    );

    return NextResponse.json({
      success: true,
      data: preorderProducts,
      count: preorderProducts.length,
    });
  } catch (error) {
    console.error("Error fetching preorder products:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch preorder products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
