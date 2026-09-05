"use client";

import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="flex min-h-screen">
        <SignupForm />
      </main>
    </Suspense>
  );
}
