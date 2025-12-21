import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";

// GET - Retrieve a specific submission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: submission, error } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        templateId: submission.template_id,
        templateName: submission.template_name,
        imageUrl: submission.image_url,
        timestamp: submission.created_at,
        metadata: submission.metadata,
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete a submission (requires authentication)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No token provided",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (!user || authError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid token",
        },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get submission to find image path
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission not found",
        },
        { status: 404 }
      );
    }

    // Delete image from storage (if it still exists)
    if (submission.image_url) {
      await supabaseAdmin.storage.from("float-images").remove([`${id}.png`]);
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from("submissions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete submission",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission permanently deleted",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
