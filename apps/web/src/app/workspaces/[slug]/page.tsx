import { WorkspaceShell } from "@/components/workspace-shell";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

type WorkspacePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  const { slug } = await params;
  const userName = session.user.name ?? session.user.email ?? "Workspace owner";
  const userId = session.user.id ?? session.user.email;
  const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4001";

  return (
    <WorkspaceShell
      realtimeUrl={realtimeUrl}
      userId={userId}
      userName={userName}
      workspaceSlug={slug}
    />
  );
}