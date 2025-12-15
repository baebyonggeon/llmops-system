import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { MbrBas } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: (MbrBas & { role?: "admin" | "user" }) | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: (MbrBas & { role?: "admin" | "user" }) | null = null;

  try {
    const authUser = await sdk.authenticateRequest(opts.req);
    if (authUser) {
      user = {
        ...authUser,
        role: authUser.mbrTypeCd === "admin" ? "admin" : "user",
      };
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
