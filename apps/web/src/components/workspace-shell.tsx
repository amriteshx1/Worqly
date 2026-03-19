import { draftChannels, draftDocs, draftMembers, draftRooms } from "@/lib/demo-data";

type WorkspaceShellProps = {
  workspaceSlug: string;
  userName: string;
};

export function WorkspaceShell({ workspaceSlug, userName }: WorkspaceShellProps) {
  return (
    <main className="workspace-page">
      <section className="workspace-hero">
        <div>
          <p className="eyebrow">Protected shell</p>
          <h1>{workspaceSlug}</h1>
        </div>
        <div className="hero-meta">
          <span>{userName}</span>
          <span>owner</span>
          <span>desktop-first v1</span>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="workspace-sidebar panel-chrome">
          <p className="column-label">Spaces</p>
          <div className="stack">
            <div className="sidebar-card accent-coral">
              <strong>Chat</strong>
              <span>Socket.IO events, typing, presence</span>
            </div>
            <div className="sidebar-card accent-sand">
              <strong>Docs</strong>
              <span>Yjs-ready collaborative document lanes</span>
            </div>
            <div className="sidebar-card accent-teal">
              <strong>Rooms</strong>
              <span>Voice/video shell prepared for WebRTC</span>
            </div>
          </div>
        </aside>

        <section className="workspace-column panel-chrome">
          <p className="column-label">Channels</p>
          <div className="stack">
            {draftChannels.map((channel) => (
              <article className="list-card" key={channel.id}>
                <div>
                  <strong>#{channel.name}</strong>
                  <p>Realtime feed ready for Phase 2 message fan-out.</p>
                </div>
                <span className="badge">{channel.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace-column panel-chrome">
          <p className="column-label">Docs</p>
          <div className="stack">
            {draftDocs.map((doc) => (
              <article className="list-card" key={doc.id}>
                <div>
                  <strong>{doc.title}</strong>
                  <p>Shared cursor awareness and snapshot persistence placeholder.</p>
                </div>
                <span className="badge">{doc.presence}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace-column panel-chrome">
          <p className="column-label">Rooms</p>
          <div className="stack">
            {draftRooms.map((room) => (
              <article className="list-card" key={room.id}>
                <div>
                  <strong>{room.name}</strong>
                  <p>Mesh-call signaling is staged behind the realtime backend.</p>
                </div>
                <span className="badge">{room.members}</span>
              </article>
            ))}
          </div>
        </section>

        <aside className="workspace-sidebar panel-chrome">
          <p className="column-label">Presence</p>
          <div className="stack">
            {draftMembers.map((member) => (
              <article className="member-card" key={member.id}>
                <div className="presence-dot" />
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.state}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

