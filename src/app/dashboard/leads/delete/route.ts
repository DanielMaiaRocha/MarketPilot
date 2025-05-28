import { NextRequest, NextResponse } from "next/server";
import { deleteLeadAction } from "@/app/actions";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  await deleteLeadAction(formData);
  return NextResponse.redirect(new URL("/dashboard/leads", request.url));
}
