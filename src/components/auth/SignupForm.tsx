"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { states } from "@/data/states";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { LogoMark } from "@/components/auth/LogoMark";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Spinner } from "@/components/auth/Spinner";

const fieldClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

export function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get("full_name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const dateOfBirth = String(formData.get("date_of_birth") ?? "");
    const stateIdRaw = Number(formData.get("state_id"));
    const stateId = Number.isFinite(stateIdRaw) && stateIdRaw > 0 ? stateIdRaw : null;

    const { error: signUpError, needsEmailConfirmation } = await signUp(email, password, {
      fullName,
      dateOfBirth,
      stateId,
    });
    setPending(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (needsEmailConfirmation) {
      setMessage("Sila semak emel anda untuk sahkan akaun sebelum log masuk.");
      return;
    }

    router.push("/");
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
          <h1 className="text-xl font-semibold text-foreground">Daftar akaun</h1>
          <p className="mb-6 text-sm text-foreground/60">
            Daftar untuk simpan maklumat giliran anda.
          </p>

          {message ? (
            <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">{message}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                name="full_name"
                type="text"
                placeholder="Nama penuh"
                required
                className={fieldClass}
              />
              <input
                name="email"
                type="email"
                placeholder="Emel"
                required
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "signup-form-error" : undefined}
                className={fieldClass}
              />
              <PasswordInput
                name="password"
                placeholder="Kata laluan"
                required
                autoComplete="new-password"
                ariaInvalid={!!error}
                ariaDescribedBy={error ? "signup-form-error" : undefined}
                className={fieldClass}
              />
              <label className="text-xs text-foreground/60" htmlFor="date_of_birth">
                Tarikh lahir <span className="text-foreground/40">(untuk keutamaan warga emas)</span>
              </label>
              <input id="date_of_birth" name="date_of_birth" type="date" required className={fieldClass} />
              <label className="text-xs text-foreground/60" htmlFor="state_id">
                Negeri
              </label>
              <select id="state_id" name="state_id" required defaultValue="" className={fieldClass}>
                <option value="" disabled>
                  Pilih negeri
                </option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
              {error && (
                <p id="signup-form-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {pending && <Spinner />}
                {pending ? "Sedang daftar…" : "Daftar"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-foreground/60">
            Sudah ada akaun?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Log masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
