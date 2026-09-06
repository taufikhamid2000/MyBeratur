"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { LogoMark } from "@/components/auth/LogoMark";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Spinner } from "@/components/auth/Spinner";

const fieldClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

export function LoginForm() {
  const { signIn, startDemo } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [demoPending, setDemoPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const { error: signInError } = await signIn(email, password);
    setPending(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    router.push(searchParams.get("redirect") || "/");
    router.refresh();
  };

  const handleDemo = async () => {
    setError(null);
    setDemoPending(true);

    const { error: demoError } = await startDemo();
    setDemoPending(false);

    if (demoError) {
      setError(demoError);
      return;
    }

    router.push(searchParams.get("redirect") || "/");
    router.refresh();
  };

  return (
    <div className="flex flex-1 md:items-stretch">
      <AuthBrandingPanel />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted px-4 py-12">
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <LogoMark size={28} />
          <span className="text-lg font-semibold text-foreground">MyBeratur</span>
        </Link>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 animate-page-in">
          <h1 className="text-xl font-semibold text-foreground">Log masuk</h1>
          <p className="mb-6 text-sm text-foreground/60">
            Log masuk untuk urus nombor giliran anda.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              name="email"
              type="email"
              placeholder="Emel"
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-form-error" : undefined}
              className={fieldClass}
            />
            <PasswordInput
              name="password"
              placeholder="Kata laluan"
              required
              autoComplete="current-password"
              ariaInvalid={!!error}
              ariaDescribedBy={error ? "login-form-error" : undefined}
              className={fieldClass}
            />
            {error && (
              <p id="login-form-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {pending && <Spinner />}
              {pending ? "Sedang log masuk…" : "Log masuk"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-foreground/40">
            <div className="h-px flex-1 bg-border" />
            atau
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleDemo}
            disabled={demoPending}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {demoPending && <Spinner />}
            {demoPending ? "Memulakan demo…" : "Cuba demo — tanpa akaun"}
          </button>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Belum ada akaun?{" "}
            <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
