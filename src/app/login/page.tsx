"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="flex min-h-screen">
        <LoginForm />
      </main>
    </Suspense>
  );
}
