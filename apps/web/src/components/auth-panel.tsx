"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type Mode = "sign-in" | "sign-up";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-up");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");

    startTransition(async () => {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({
              email,
              password,
              name,
              callbackURL: "/"
            })
          : await authClient.signIn.email({
              email,
              password,
              callbackURL: "/",
              rememberMe: true
            });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="auth-panel">
      <div className="panel-chrome">
        <p className="eyebrow">Phase 1 Access</p>
        <h2>Sign in to claim your first workspace.</h2>
        <p className="panel-copy">
          Email/password auth is wired through Better Auth so we can grow into invites, roles,
          and organization-level access without changing the shape later.
        </p>
        <div className="mode-switch">
          <button
            className={mode === "sign-up" ? "active" : ""}
            onClick={() => setMode("sign-up")}
            type="button"
          >
            Create account
          </button>
          <button
            className={mode === "sign-in" ? "active" : ""}
            onClick={() => setMode("sign-in")}
            type="button"
          >
            Sign in
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "sign-up" ? (
            <label>
              Name
              <input defaultValue="" name="name" placeholder="Your display name" required />
            </label>
          ) : null}
          <label>
            Email
            <input defaultValue="" name="email" placeholder="you@worqly.dev" required type="email" />
          </label>
          <label>
            Password
            <input defaultValue="" minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? "Working..." : mode === "sign-up" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}

