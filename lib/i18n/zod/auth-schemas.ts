import { z } from "zod";
import type { AppMessages } from "../dictionaries";

const USERNAME_REGEX = /^[a-z0-9_]+$/i;

export function buildLoginSchema(v: AppMessages["validation"]["auth"]) {
  return z.object({
    username: z
      .string()
      .trim()
      .min(3, v.usernameMin)
      .max(100, v.usernameMax)
      .regex(USERNAME_REGEX, v.usernamePattern),
    password: z.string().min(8, v.passwordMin).max(200, v.passwordMax),
  });
}

export function buildRegisterSchema(v: AppMessages["validation"]["auth"]) {
  return buildLoginSchema(v);
}
