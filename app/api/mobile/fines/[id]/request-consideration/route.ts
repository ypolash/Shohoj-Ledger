import { NextResponse } from "next/server";
import { ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";
import { POST as handleFinePost } from "../route";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const fineId = params.id;
    const body = await request.json();

    const forwardRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        ...body,
        fineId,
      }),
    });

    return await handleFinePost(forwardRequest);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
