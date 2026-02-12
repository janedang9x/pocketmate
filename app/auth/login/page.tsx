"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginInput } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase";
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

type LoginResponse =
  | {
      success: true;
      data: {
        user: { id: string; username: string };
        token: string;
        refreshToken: string;
      };
      message?: string;
    }
  | {
      success: false;
      error: string;
      code: string;
    };

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onTouched",
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const json = (await res.json().catch(() => null)) as LoginResponse | null;

    if (!res.ok || !json || json.success === false) {
      setServerError(json?.success === false ? json.error : "Login failed. Please try again.");
      return;
    }

    // MVP: keep token available for subsequent API calls that require Authorization header.
    localStorage.setItem("pm_token", json.data.token);

    // Set session in Supabase browser client so AuthProvider can detect it
    // The API sets httpOnly cookie, but browser client needs session in its own storage
    const supabase = createSupabaseBrowserClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: json.data.token,
      refresh_token: json.data.refreshToken,
    });

    if (sessionError) {
      console.error("Failed to set Supabase session:", sessionError);
      setServerError("Login succeeded but session setup failed. Please try again.");
      return;
    }
    
    // Redirect to original destination or dashboard
    const redirectTo = searchParams.get("redirect") || "/dashboard";
    router.push(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-white px-6 py-16 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back to PocketMate</CardTitle>
          <CardDescription>Log in with your username and password to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>Login failed</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="e.g. antony_88"
                {...form.register("username")}
              />
              {form.formState.errors.username?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                {...form.register("password")}
              />
              {form.formState.errors.password?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account yet?{" "}
            <Link className="text-primary underline underline-offset-4" href="/auth/register">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

