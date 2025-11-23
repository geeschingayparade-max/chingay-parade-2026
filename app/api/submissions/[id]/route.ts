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

// DELETE - Delete a specific submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Delete image from storage
    await supabaseAdmin.storage.from("float-images").remove([`${id}.png`]);

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
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
