import type { SessionOptions } from "iron-session";

export interface GoogleSession {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  email?: string;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "nova-interview-tool-secret-change-in-production-32chars",
  cookieName: "nova-interview-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  },
};
