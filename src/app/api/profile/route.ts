import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { error: "email is required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "name, email, phone, current_title, skills, experience, education, certifications, linkedin_url, website"
    )
    .eq("email", email)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 }
    );
  }

  const nameParts = (data.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const profile = {
    firstName,
    lastName,
    email: data.email,
    phone: data.phone || "",
    currentTitle: data.current_title || "",
    currentCompany: data.experience?.[0]?.company || "",
    linkedin: data.linkedin_url || "",
    website: data.website || "",
    skills: data.skills || [],
    experience: data.experience || [],
    education: data.education || [],
    certifications: data.certifications || [],
    yearsExperience: data.experience?.length
      ? new Date().getFullYear() -
        Math.min(...data.experience.map((e: { startYear: number }) => e.startYear))
      : undefined,
  };

  return NextResponse.json(profile);
}
