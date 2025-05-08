'use server';

import { auth, getAuthUser } from "@/lib/auth/server-only";
import { NextResponse } from "next/server";

export async function GET() {
  const basicAuth = auth();
  const fullAuth = await getAuthUser();
  
  // Log to server console for debugging
  console.log("Auth status check:");
  console.log("Basic auth:", basicAuth);
  console.log("Full auth:", fullAuth);
  
  return NextResponse.json({
    message: "Auth status",
    basic: basicAuth,
    full: fullAuth,
    success: true,
  });
}