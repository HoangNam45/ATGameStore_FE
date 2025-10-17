import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/firebaseClient";

export async function GET() {
  try {
    const allProducts = await getAllProducts();
    const availableProducts = allProducts.filter(
      (product) => product.type === "available"
    );

    return NextResponse.json({
      success: true,
      data: availableProducts,
      count: availableProducts.length,
    });
  } catch (error) {
    console.error("Error fetching available products:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch available products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
