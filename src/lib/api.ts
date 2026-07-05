// Small API-route helpers: JSON responses + error mapping.

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a route handler with uniform error handling. */
export function handle<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof AuthError) return fail(e.message, e.status);
      if (e instanceof ZodError) return fail(e.errors.map((x) => x.message).join("; "), 422);
      console.error(e);
      return fail(e instanceof Error ? e.message : "Internal error", 500);
    }
  };
}
