import { NextRequest, NextResponse } from "next/server";
import {
  getAllProducts,
  getAllProductsWithCredentials,
} from "@/lib/firebaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productCode: string }> }
) {
  try {
    const { productCode } = await params;
    const { searchParams } = new URL(request.url);
    const includeCredentials =
      searchParams.get("includeCredentials") === "true";
    const backendKey = searchParams.get("backendKey");

    if (!productCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Product code is required",
        },
        { status: 400 }
      );
    }

    // Check if this is a backend request for credentials
    if (includeCredentials) {
      // Verify backend key for security
      if (backendKey !== process.env.BACKEND_SECRET_KEY) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized access to credentials",
          },
          { status: 401 }
        );
      }

      // Get products with credentials (for backend use)
      const products = await getAllProductsWithCredentials("backend_access");
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
