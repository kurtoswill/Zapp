/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ============================================================
// GET - Get a single specialist by ID with profile data
// Accepts either specialists.id OR user_id — tries both.
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Specialist ID is required" },
        { status: 400 }
      );
    }

    const selectFields = `
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        email,
        phone,
        province,
        municipality
      )
    `;

    type SpecialistRow = {
      id: string;
      user_id: string;
      profession: string | null;
      rating_avg: number | null;
      jobs_completed: number | null;
      location_lat: number | null;
      location_lng: number | null;
      rate: number | null;
      min_rate: number | null;
      is_online: boolean | null;
      is_verified: boolean | null;
      profiles: {
        full_name: string | null;
        avatar_url: string | null;
        email: string | null;
        phone: string | null;
        province: string | null;
        municipality: string | null;
      } | null;
    };

    // First: try looking up by specialists table row id (specialists.id)
    let { data, error } = await supabase
      .from("specialists")
      .select(selectFields)
      .eq("id", id)
      .maybeSingle() as { data: SpecialistRow | null; error: { message: string } | null };

    // Second: if not found, try looking up by user_id (auth uuid)
    if (!data) {
      const result = await supabase
        .from("specialists")
        .select(selectFields)
        .eq("user_id", id)
        .maybeSingle() as { data: SpecialistRow | null; error: { message: string } | null };

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Supabase error fetching specialist:", error);
      return NextResponse.json(
        { error: "Failed to fetch specialist", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Specialist not found" },
        { status: 404 }
      );
    }

    // Fetch wallet balance from worker_details
    const { data: walletData } = await supabase
      .from("worker_details")
      .select("wallet_balance")
      .eq("id", data.user_id)
      .maybeSingle() as { data: { wallet_balance: number } | null; error: any };

    // Compute review count from reviews table (specialists table has no total_reviews column)
    const { error: reviewCountError, count } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewee_id', data.user_id);

    if (reviewCountError) {
      console.error('Failed to fetch reviews count:', reviewCountError);
    }

    // Recalculate average rating from all reviews for this user
    let computedRating = data.rating_avg || 0;
    const { data: reviewRows, error: reviewRowsError } = await supabase
      .from<{ rating_value: number }>('reviews')
      .select('rating_value')
      .eq('reviewee_id', data.user_id);

    if (reviewRowsError) {
      console.error('Failed to fetch reviews for average rating:', reviewRowsError);
    } else if (reviewRows && reviewRows.length > 0) {
      const total = reviewRows.reduce((sum, row) => sum + (row.rating_value ?? 0), 0);
      computedRating = total / reviewRows.length;

      // Persist computed rating to specialists table (non-blocking)
      const { error: ratingUpdateError } = await supabase
        .from<SpecialistRow>('specialists')
        .update({ rating_avg: computedRating })
        .eq('user_id', data.user_id);

      if (ratingUpdateError) {
        console.error('Failed to persist computed specialist rating_avg:', ratingUpdateError);
      }
    }

    const specialist = {
      id: data.id,
      user_id: data.user_id,
      full_name: data.profiles?.full_name || null,
      email: data.profiles?.email || null,
      avatar_url: data.profiles?.avatar_url || null,
      phone: data.profiles?.phone || null,
      role: data.profession || null,
      province: data.profiles?.province || null,
      municipality: data.profiles?.municipality || null,
      location_lat: data.location_lat || null,
      location_lng: data.location_lng || null,
      rating: computedRating || 0,
      reviews_count: count || 0,
      jobs_completed: data.jobs_completed || 0,
      rate: data.rate || null,
      min_rate: data.min_rate || null,
      is_online: data.is_online || false,
      is_verified: data.is_verified || false,
      wallet_balance: walletData?.wallet_balance || 0,
    };

    return NextResponse.json(
      { success: true, specialist },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/specialists/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}