import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { isOwner } from "@/lib/firebaseClient";

export async function GET(request: NextRequest) {
  try {
    // Get owner UID from request headers (set by middleware or auth context)
    const headersList = await headers();
    const ownerUid = headersList.get("x-owner-uid");

    if (!ownerUid) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Owner UID required",
        },
        { status: 401 }
      );
    }

    // Verify user is actually an owner
    const isOwnerUser = await isOwner(ownerUid);
    if (!isOwnerUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Owner access required",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error fetching products with credentials:", error);

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
