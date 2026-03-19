"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type WorkspaceCreatorProps = {
  userName: string;
};

export function WorkspaceCreator({ userName }: WorkspaceCreatorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const slug = String(formData.get("slug") ?? "");

    startTransition(async () => {
      const result = await authClient.organization.create({
        name,
        slug
      });

      if (result.error) {
        setError(result.error.message ?? "Workspace creation failed.");
        return;
      }

      router.push(`/workspaces/${slug}`);
      router.refresh();
    });
  }

  return (
    <section className="creator-card">
      <div className="panel-chrome">
        <p className="eyebrow">Welcome back</p>
        <h2>{userName}, let&apos;s spin up the first Worqly workspace.</h2>
        <p className="panel-copy">
          This uses Better Auth organizations as the Phase 1 workspace membership layer, which
          keeps roles and invites on a path we can grow later.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Workspace name
            <input defaultValue="Worqly Lab" name="name" required />
          </label>
          <label>
            Workspace slug
            <input defaultValue="worqly-lab" name="slug" pattern="[a-z0-9-]+" required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? "Creating..." : "Create workspace"}
          </button>
        </form>
      </div>
    </section>
  );
}