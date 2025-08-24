import { NextResponse } from "next/server"

export async function POST() {
  // Client will handle removing token from localStorage
  return NextResponse.json({ message: "Logged out successfully" })
}
