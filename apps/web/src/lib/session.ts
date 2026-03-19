import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSession() {
  const requestHeaders = await headers();

  return auth.api.getSession({
    headers: requestHeaders
  });
}

