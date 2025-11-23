import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// DELETE - Soft delete (remove image but keep submission record)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
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

    if (submission.status === "removed") {
      return NextResponse.json(
        {
          success: false,
          error: "Submission already removed",
        },
        { status: 400 }
      );
    }

    // Delete image from storage (if it exists)
    if (submission.image_url) {
      await supabaseAdmin.storage.from("float-images").remove([`${id}.png`]);
    }

    // Update submission record (soft delete)
    const { error: updateError } = await supabaseAdmin
      .from("submissions")
      .update({
        image_url: null, // Remove image URL
        status: "removed", // Mark as removed
        removed_at: new Date().toISOString(),
        removed_by: user.id,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update submission",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Float removed successfully",
    });
  } catch (error) {
    console.error("Moderate error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
