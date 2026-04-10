import { DocumentWorkspace } from "@/components/document-workspace";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

type DocumentPageProps = {
  params: Promise<{
    slug: string;
    docId: string;
  }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  const { docId, slug } = await params;
  const userName = session.user.name ?? session.user.email ?? "Workspace owner";
  const userId = session.user.id ?? session.user.email;
  const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4001";

  return (
    <DocumentWorkspace
      documentId={docId}
      realtimeUrl={realtimeUrl}
      userId={userId}
      userName={userName}
      workspaceSlug={slug}
    />
  );
}