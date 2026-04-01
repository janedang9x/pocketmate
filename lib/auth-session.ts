export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60; // 1 hour
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

const secure = process.env.NODE_ENV === "production";

export const accessTokenCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
};
