import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ============================================================
// GET - Get specialists by profession
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const profession = searchParams.get("profession");
    const isOnline = searchParams.get("isOnline");
    const isVerified = searchParams.get("isVerified");
    const limit = searchParams.get("limit") || "20";

    // Build query - fetch specialists with profile data
    let query = supabase
      .from("specialists")
      .select(
        `
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          email,
          phone
        )
      `,
      )
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .limit(parseInt(limit));

    // Filter by profession if provided
    if (profession) {
      query = query.eq("profession", profession);
    }

    // Filter by online status if provided
    if (isOnline !== null && isOnline !== undefined) {
      query = query.eq("is_online", isOnline === "true");
    }

    // Filter by verified status if provided
    if (isVerified !== null && isVerified !== undefined) {
      query = query.eq("is_verified", isVerified === "true");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error fetching specialists:", error);
      return NextResponse.json(
        { error: "Failed to fetch specialists", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, specialists: data },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/specialists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
