import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";

// Helper to verify auth token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "No token provided" };
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (!user || authError) {
    return { user: null, error: "Invalid token" };
  }

  return { user, error: null };
}

// DELETE - Soft delete (hide from parade but keep image for recovery)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: `Unauthorized - ${authError}` },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { success: false, error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.status === "removed") {
      return NextResponse.json(
        { success: false, error: "Submission already removed" },
        { status: 400 }
      );
    }

    // Soft delete - keep image, just change status
    // Image stays in storage for potential recovery
    const { error: updateError } = await supabaseAdmin
      .from("submissions")
      .update({
        status: "removed",
        removed_at: new Date().toISOString(),
        removed_by: user.id,
        // Keep image_url intact for recovery!
      })
      .eq("id", id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Float removed from parade (can be restored)",
    });
  } catch (error) {
    console.error("Moderate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Restore a removed submission back to active
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: `Unauthorized - ${authError}` },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { success: false, error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.status === "active") {
      return NextResponse.json(
        { success: false, error: "Submission is already active" },
        { status: 400 }
      );
    }

    if (!submission.image_url) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot restore - image was permanently deleted",
        },
        { status: 400 }
      );
    }

    // Restore to active status
    const { error: updateError } = await supabaseAdmin
      .from("submissions")
      .update({
        status: "active",
        removed_at: null,
        removed_by: null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to restore submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Float restored to parade!",
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
