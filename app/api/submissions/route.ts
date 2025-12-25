import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";

// POST - Submit a new drawing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, templateName, imageData, timestamp, metadata } = body;

    // Validate required fields
    if (!templateId || !imageData || !timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: templateId, imageData, timestamp",
        },
        { status: 400 }
      );
    }

    // Generate unique submission ID
    const submissionId = `${templateId}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    // Extract base64 data from data URL
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Upload image to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("float-images")
      .upload(`${submissionId}.png`, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload image",
        },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("float-images")
      .getPublicUrl(`${submissionId}.png`);

    // Insert submission record into database
    const { error: dbError } = await supabaseAdmin
      .from("submissions")
      .insert({
        id: submissionId,
        template_id: templateId,
        template_name: templateName,
        image_url: publicUrl,
        created_at: timestamp,
        metadata: metadata || {},
        status: "active", // Set as active by default
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to clean up uploaded image
      await supabaseAdmin.storage
        .from("float-images")
        .remove([`${submissionId}.png`]);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to save submission",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Drawing submitted successfully!",
        submissionId,
        imageUrl: publicUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve all submissions
export async function GET() {
  try {
    const { data: submissions, error } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch submissions",
        },
        { status: 500 }
      );
    }

    // Transform data to match existing format
    const transformedSubmissions = submissions.map((sub: any) => ({
      id: sub.id,
      templateId: sub.template_id,
      templateName: sub.template_name,
      imageUrl: sub.image_url,
      timestamp: sub.created_at,
      metadata: sub.metadata,
    }));

    return NextResponse.json({
      success: true,
      count: submissions.length,
      submissions: transformedSubmissions,
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
