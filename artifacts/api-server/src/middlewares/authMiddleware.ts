import type { AuthUser } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }
  }
}

export interface AuthedRequest extends Request {
  user: Express.User;
}

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
};

function getBearerToken(req: Request) {
  const value = req.headers.authorization;
  if (!value?.startsWith("Bearer ")) return null;
  return value.slice("Bearer ".length);
}

async function getSupabaseUser(accessToken: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  return response.json() as Promise<SupabaseUser>;
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (): this is AuthedRequest {
    return this.user !== undefined;
  };

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    next();
    return;
  }

  try {
    const supabaseUser = await getSupabaseUser(accessToken);
    if (!supabaseUser) {
      next();
      return;
    }

    const email = supabaseUser.email?.toLowerCase() ?? null;
    const metadata = supabaseUser.user_metadata ?? {};
    const fullName = metadata.full_name ?? metadata.name ?? "";
    const [firstName = "", ...lastNameParts] = fullName.trim().split(/\s+/);
    const lastName = lastNameParts.join(" ");
    const avatar = metadata.avatar_url ?? metadata.picture ?? "";

    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.replitId, supabaseUser.id));

    const isInitialAdmin =
      email !== null &&
      email === (process.env.ADMIN_EMAIL ?? "").toLowerCase();

    const role = isInitialAdmin
      ? "admin"
      : (existingUser?.role ?? "user");

    const dbUser = existingUser
      ? (
          await db
            .update(usersTable)
            .set({
              email,
              firstName: firstName || null,
              lastName: lastName || null,
              name: fullName || existingUser.name,
              avatar: avatar || existingUser.avatar,
              role,
            })
            .where(eq(usersTable.id, existingUser.id))
            .returning()
        )[0]
      : (
          await db
            .insert(usersTable)
            .values({
              replitId: supabaseUser.id,
              email,
              firstName: firstName || null,
              lastName: lastName || null,
              name: fullName || "مستخدم كورة بول",
              username: `user_${supabaseUser.id.slice(0, 8)}`,
              avatar,
              role,
            })
            .returning()
        )[0];

    req.user = {
      id: String(dbUser.id),
      email: dbUser.email ?? null,
      firstName: dbUser.firstName ?? null,
      lastName: dbUser.lastName ?? null,
      profileImageUrl: dbUser.avatar ?? null,
      role: (dbUser.role ?? "user") as "user" | "admin",
      displayName: dbUser.name ?? null,
      isProfileComplete: dbUser.isProfileComplete ?? false,
    } as Express.User;
  } catch (error) {
    console.error("Supabase authentication error", error);
  }

  next();
}