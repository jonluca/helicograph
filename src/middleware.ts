import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const username = "helicograph";
const password = "halcyon";
function isAuthenticated(req: NextRequest) {
  const authheader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authheader) {
    return false;
  }

  const auth = Buffer.from(authheader.split(" ")[1], "base64").toString().split(":");
  const user = auth[0];
  const pass = auth[1];

  return user == username && pass == password;
}

export function middleware(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }

  return NextResponse.next();
}
