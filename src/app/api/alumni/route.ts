import { NextResponse } from "next/server";
import { listAlumni } from "@/actions/alumni.actions";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page") ?? "1"));
    const qsTiers = params.getAll("qsTier");
    const languages = params.getAll("language");
    const gradYearMin = params.get("gradYearMin");
    const gradYearMax = params.get("gradYearMax");
    const priceMin = params.get("priceMin");
    const priceMax = params.get("priceMax");
    const pageSize = params.get("pageSize");

    const result = await listAlumni({
      search: params.get("search") ?? undefined,
      university: params.get("university") ?? undefined,
      country: params.get("country") ?? undefined,
      course: params.get("course") ?? undefined,
      studyLevel: params.get("studyLevel") ?? undefined,
      gradYearMin: gradYearMin ? Number(gradYearMin) : undefined,
      gradYearMax: gradYearMax ? Number(gradYearMax) : undefined,
      qsTiers,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      languages: languages.length > 0 ? languages : undefined,
      minRating: params.get("minRating") ?? undefined,
      availability: params.get("availability") ?? undefined,
      sessionType: params.get("sessionType") ?? undefined,
      sortBy: params.get("sortBy") ?? undefined,
      page,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return NextResponse.json(result, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("GET /api/alumni error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alumni", items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 },
      { status: 500 }
    );
  }
}
