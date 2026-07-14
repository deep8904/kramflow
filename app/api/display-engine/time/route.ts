import { NextResponse } from "next/server";

/**
 * Time Synchronization Service — returns the server's clock so every
 * display can compute an offset against its own local clock, independent
 * of whatever the device's system time happens to be set to.
 */
export async function GET() {
  return NextResponse.json({ serverTime: Date.now() });
}
