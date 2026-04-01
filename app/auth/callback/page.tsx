"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import { AuthLocaleBar } from "@/components/auth/AuthLocaleBar";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * OAuth return URL must be read from window.location, not useSearchParams(), which can be
 * empty on the first effect run (hydration). We also handle Strict Mode / parallel runs
 * by preferring an existing session after a failed duplicate exchange.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { messages: m } = useLocaleContext();
  const [state, setState] = useState<"working" | "error">("working");
  const [message, setMessage] = useState<string | null>(null);

  const c = m.auth.callback;

  useEffect(() => {
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const redirectTo = url.searchParams.get("redirect") || "/dashboard";

      const oauthError = url.searchParams.get("error");
      const oauthDescription = url.searchParams.get("error_description");
      if (oauthError) {
        setState("error");
        setMessage(
          oauthDescription?.replace(/\+/g, " ") ||
            (oauthError === "access_denied" ? c.cancelled : c.googleFailed),
        );
        return;
      }

      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        const code = url.searchParams.get("code");
        if (!code) {
          setState("error");
          setMessage(c.missingCode);
          return;
        }

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError || !data.session?.access_token) {
          const retry = await supabase.auth.getSession();
          session = retry.data.session;
          if (!session?.access_token) {
            setState("error");
            setMessage(exchangeError?.message || c.exchangeFailed);
            return;
          }
        } else {
          session = data.session;
        }
      }

      const res = await fetch("/api/auth/oauth-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: session.access_token,
          refreshToken: session.refresh_token ?? "",
        }),
      });

      const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (!res.ok || !json || json.success !== true) {
        setState("error");
        setMessage(c.sessionSetup);
        return;
      }

      localStorage.setItem("pm_token", session.access_token);
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token ?? "",
      });
      router.replace(redirectTo);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- OAuth exchange runs once on mount
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-white px-6 py-16 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <AuthLocaleBar />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{state === "working" ? c.titleWorking : c.titleError}</CardTitle>
          <CardDescription>
            {state === "working" ? c.descWorking : c.descError}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "error" && message ? (
            <Alert variant="destructive">
              <AlertTitle>{c.errorTitle}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">{m.common.pleaseWait}</p>
          )}
        </CardContent>
        {state === "error" ? (
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/auth/login">{m.common.backToLogin}</Link>
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </main>
  );
}
