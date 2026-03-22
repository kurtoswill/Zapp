import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// ============================================================
// Validation Schema for Status Update (MATCHES DATABASE ENUM)
// ============================================================
const updateJobStatusSchema = z.object({
  status: z.enum(['pending', 'bid_accepted', 'on_the_way', 'working', 'completed']).optional(),
  specialist_id: z.string().uuid().nullable().optional(),
  reassign: z.boolean().optional(),
});

// ============================================================
// Type for update data
// ============================================================
interface JobUpdateData {
  status: 'pending' | 'bid_accepted' | 'on_the_way' | 'working' | 'completed';
  specialist_id?: string;
  accepted_at?: string;
  completed_at?: string;
}

// ============================================================
// GET - Get a single job by ID
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch job', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, job: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/jobs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update job status
// ============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("===== PATCH /api/jobs/[id] Called =====");
    console.log("Job ID:", id);
    
    const body = await request.json();
    console.log("Request body:", body);

    // Validate request body
    const validation = updateJobStatusSchema.safeParse(body);
    if (!validation.success) {
      console.log("Validation failed:", validation.error.issues);
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { status, specialist_id, reassign } = validation.data;
    console.log("Parsed values - status:", status, "specialist_id:", specialist_id, "reassign:", reassign);

    // If caller requests reassign, do specialist selection logic and return early
    if (reassign) {
      const { data: jobData, error: jobFetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (jobFetchError || !jobData) {
        return NextResponse.json(
          { error: 'Job not found for reassign' },
          { status: 404 }
        );
      }

      const profession = jobData.profession;
      const customerLat = jobData.location_lat;
      const customerLng = jobData.location_lng;
      const excludedSpecialist = jobData.specialist_id;

      const { data: specialists, error: specErr } = await supabase
        .from('specialists')
        .select('*')
        .eq('profession', profession)
        .eq('is_online', true)
        .eq('is_verified', true)
        .neq('id', excludedSpecialist);

      if (specErr) {
        console.error('Specialist lookup error during reassign:', specErr);
        return NextResponse.json(
          { error: 'Failed to fetch specialists', details: specErr.message },
          { status: 500 }
        );
      }

      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const getDistance = (
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number,
      ) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lng2 - lng1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      let nearest: typeof specialists[number] | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      const hasLocation = customerLat != null && customerLng != null;

      if (specialists && specialists.length > 0) {
        for (const spec of specialists) {
          if (!hasLocation || spec.location_lat == null || spec.location_lng == null) {
            if (!nearest) nearest = spec;
            continue;
          }

          const dist = getDistance(
            customerLat,
            customerLng,
            spec.location_lat,
            spec.location_lng,
          );

          if (dist < nearestDistance) {
            nearestDistance = dist;
            nearest = spec;
          }
        }
      }

      const updateData: Partial<JobUpdateData> = {
        status: 'pending',
        specialist_id: nearest ? nearest.id : null,
      };

      const { data: updatedJob, error: updateErr } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        console.error('Failed to reassign job:', updateErr);
        return NextResponse.json(
          { error: 'Failed to reassign job', details: updateErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, job: updatedJob, matched_specialist: nearest },
        { status: 200 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required for update' },
        { status: 400 }
      );
    }

    // Build update object with proper type
    const updateData: JobUpdateData = { status };

    // Add specialist_id if provided (when job is accepted)
    if (specialist_id !== undefined) {
      updateData.specialist_id = specialist_id ?? undefined;
      if (specialist_id) {
        updateData.accepted_at = new Date().toISOString();
        
        // Verify specialist exists before updating
        console.log("Checking if specialist exists with ID:", specialist_id);
        const { data: specialistCheck, error: specialistCheckError } = await supabase
          .from("specialists")
          .select("id")
          .eq("id", specialist_id)
          .single();
        
        console.log("Specialist check result:", { specialistCheck, specialistCheckError });
        
        if (specialistCheckError || !specialistCheck) {
          console.error("Specialist not found with ID:", specialist_id);
          return NextResponse.json(
            { error: "Specialist not found", specialist_id, details: specialistCheckError?.message },
            { status: 404 }
          );
        }
      }
    }

    // Add completed_at if status is completed
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    console.log("Update data to send:", updateData);
    console.log("Updating job with ID:", id);

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log("Supabase response - error:", error, "data:", data);

    if (error) {
      console.error('Supabase error updating job:', error);
      return NextResponse.json(
        { error: 'Failed to update job', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, job: data },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error in PATCH /api/jobs/[id]:', errorMsg, error);
    return NextResponse.json(
      { error: 'Internal server error', message: errorMsg },
      { status: 500 }
    );
  }
}