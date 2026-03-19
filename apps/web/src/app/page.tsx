import { AuthPanel } from "@/components/auth-panel";
import { WorkspaceCreator } from "@/components/workspace-creator";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "there";

  return (
    <main className="landing-page">
      <section className="hero-copy">
        <p className="eyebrow">Worqly Phase 1</p>
        <h1>Chat, docs, rooms, and AI should feel like one workspace, not four stitched apps.</h1>
        <p className="hero-text">
          This starter locks the project into a clean monorepo, shared event vocabulary, Better
          Auth workspace membership, and a protected app shell that can grow into realtime product
          features without needing a rewrite.
        </p>
        <div className="hero-callouts">
          <span>Next.js shell</span>
          <span>Fastify + Socket.IO</span>
          <span>Drizzle + Postgres</span>
          <span>Redis-backed realtime state</span>
        </div>
      </section>
      {session?.user ? <WorkspaceCreator userName={userName} /> : <AuthPanel />}
    </main>
  );
}