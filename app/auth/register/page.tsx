"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import type { RegisterInput as ApiRegisterInput } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/auth-oauth";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { buildRegisterSchema } from "@/lib/i18n/zod/auth-schemas";
import { AuthLocaleBar } from "@/components/auth/AuthLocaleBar";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type RegisterResponse =
  | {
      success: true;
      data: {
        user: { id: string; username: string; createdAt: string };
        token: string;
        refreshToken?: string;
      };
      message?: string;
    }
  | {
      success: false;
      error: string;
      code: string;
    };

type RegisterInput = z.infer<ReturnType<typeof buildRegisterSchema>>;

export default function RegisterPage() {
  const router = useRouter();
  const { messages: m } = useLocaleContext();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const registerSchemaResolved = useMemo(() => buildRegisterSchema(m.validation.auth), [m]);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchemaResolved),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onTouched",
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);

    const body = values as ApiRegisterInput;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => null)) as RegisterResponse | null;

    if (!res.ok || !json || json.success === false) {
      setServerError(json?.success === false ? json.error : m.auth.register.registerFailed);
      return;
    }

    localStorage.setItem("pm_token", json.data.token);
    const supabase = createSupabaseBrowserClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: json.data.token,
      refresh_token: json.data.refreshToken ?? "",
    });
    if (sessionError) {
      console.error("Failed to set Supabase session after register:", sessionError);
      setServerError(m.auth.register.sessionFailed);
      return;
    }
    router.push("/dashboard");
  }

  async function onGoogleRegister() {
    setServerError(null);
    setGoogleLoading(true);
    const err = await signInWithGoogle("/dashboard");
    setGoogleLoading(false);
    if (err) {
      setServerError(err.message || m.auth.register.googleFailed);
    }
  }

  const a = m.auth.register;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-white px-6 py-16 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <AuthLocaleBar />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{a.title}</CardTitle>
          <CardDescription>{a.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>{a.failedTitle}</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            className="w-full"
            type="button"
            variant="outline"
            disabled={googleLoading || form.formState.isSubmitting}
            onClick={() => void onGoogleRegister()}
          >
            {googleLoading ? a.redirecting : a.googleContinue}
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>{m.common.or}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username">{a.username}</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder={a.usernamePlaceholder}
                {...form.register("username")}
              />
              {form.formState.errors.username?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{a.password}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={a.passwordPlaceholder}
                {...form.register("password")}
              />
              {form.formState.errors.password?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? a.submitting : a.submit}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {a.footerPrefix}{" "}
            <Link className="text-primary underline underline-offset-4" href="/auth/login">
              {a.footerLink}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
