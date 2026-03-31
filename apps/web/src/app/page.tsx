import { AuthPanel } from "@/components/auth-panel";
import { WorkspaceCreator } from "@/components/workspace-creator";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "there";

  return (
    <main className="landing-page">
      <section className="hero-copy">
        <p className="eyebrow">Worqly Phase 2</p>
        <h1>Live channels and presence are now shaping the workspace into something people can actually use.</h1>
        <p className="hero-text">
          The current build now goes past the shell: the realtime service fans messages across clients,
          typing signals show up live, and workspace presence follows the active channel in real time.
        </p>
        <div className="hero-callouts">
          <span>Next.js shell</span>
          <span>Fastify + Socket.IO</span>
          <span>Live chat + typing</span>
          <span>Workspace presence</span>
        </div>
      </section>
      {session?.user ? <WorkspaceCreator userName={userName} /> : <AuthPanel />}
    </main>
  );
}
