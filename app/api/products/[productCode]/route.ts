import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/firebaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productCode: string }> }
) {
  try {
    const { productCode } = await params;

    if (!productCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Product code is required",
        },
        { status: 400 }
      );
    }

    // Regular user request (without credentials)
    const products = await getAllProducts();
    const product = products.find((p) => p.productCode === productCode);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
