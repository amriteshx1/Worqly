"use client";

import type {
  ChatMessage,
  EventEnvelope,
  PresenceState,
  WorkspaceBootstrap,
  WorkspaceChannel
} from "@worqly/shared";
import { defaultWorkspaceChannels, workspaceBootstrapSchema } from "@worqly/shared";
import { draftDocs, draftRooms } from "@/lib/demo-data";
import Link from "next/link";
import type { Route } from "next";
import { FormEvent, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

type WorkspaceShellProps = {
  workspaceSlug: string;
  userId: string;
  userName: string;
  realtimeUrl: string;
};

type RemoteTypingState = {
  channelId: string;
  userId: string;
  userName: string;
};

function createEmptyMessages(channels: WorkspaceChannel[]) {
  return Object.fromEntries(channels.map((channel) => [channel.id, [] as ChatMessage[]]));
}

function buildMessageFromEvent(event: EventEnvelope<"message.sent">): ChatMessage {
  return {
    id: event.payload.messageId,
    workspaceId: event.payload.workspaceId,
    channelId: event.payload.channelId,
    authorId: event.payload.actorId,
    authorName: event.payload.authorName,
    body: event.payload.body,
    sentAt: event.payload.sentAt
  };
}

export function WorkspaceShell({ realtimeUrl, userId, userName, workspaceSlug }: WorkspaceShellProps) {
  const [channels, setChannels] = useState<WorkspaceChannel[]>(defaultWorkspaceChannels);
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessage[]>>(() =>
    createEmptyMessages(defaultWorkspaceChannels)
  );
  const [presence, setPresence] = useState<PresenceState[]>([]);
  const [activeChannelId, setActiveChannelId] = useState(defaultWorkspaceChannels[0].id);
  const [draft, setDraft] = useState("");
  const [socketStatus, setSocketStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [typingUsers, setTypingUsers] = useState<Record<string, RemoteTypingState>>({});

  const socketRef = useRef<Socket | null>(null);
  const localTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef(activeChannelId);
  const isTypingRef = useRef(false);
  const remoteTypingTimeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  function clearRemoteTypingKey(key: string) {
    const timeout = remoteTypingTimeoutsRef.current.get(key);

    if (timeout) {
      clearTimeout(timeout);
      remoteTypingTimeoutsRef.current.delete(key);
    }

    setTypingUsers((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function emitTypingStop(channelId = typingChannelRef.current) {
    if (!socketRef.current || !isTypingRef.current) {
      return;
    }

    socketRef.current.emit("typing:stop", {
      workspaceId: workspaceSlug,
      channelId,
      actorId: userId,
      userName
    });

    isTypingRef.current = false;

    if (localTypingTimeoutRef.current) {
      clearTimeout(localTypingTimeoutRef.current);
      localTypingTimeoutRef.current = null;
    }
  }

  function scheduleTypingStop(channelId: string) {
    if (localTypingTimeoutRef.current) {
      clearTimeout(localTypingTimeoutRef.current);
    }

    localTypingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(channelId);
    }, 1400);
  }

  useEffect(() => {
    const socket = io(realtimeUrl, {
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("online");
      socket.emit("workspace:join", {
        workspaceId: workspaceSlug,
        userId,
        userName,
        activeSurface: activeChannelId
      });
    });

    socket.on("disconnect", () => {
      setSocketStatus("offline");
    });

    socket.on("workspace.bootstrap", (payload: WorkspaceBootstrap) => {
      const parsed = workspaceBootstrapSchema.parse(payload);
      setChannels(parsed.channels);
      setMessagesByChannel(parsed.messagesByChannel);
      setPresence(parsed.presence);

      if (!parsed.messagesByChannel[activeChannelId] && parsed.channels[0]) {
        setActiveChannelId(parsed.channels[0].id);
      }
    });

    socket.on("presence.updated", (nextPresence: PresenceState[]) => {
      setPresence(nextPresence);
    });

    socket.on("message.sent", (event: EventEnvelope<"message.sent">) => {
      const message = buildMessageFromEvent(event);

      setMessagesByChannel((current) => ({
        ...current,
        [message.channelId]: [...(current[message.channelId] ?? []), message]
      }));
    });

    socket.on("message.typing.started", (event: EventEnvelope<"message.typing.started">) => {
      if (event.payload.actorId === userId) {
        return;
      }

      const key = `${event.payload.actorId}:${event.payload.channelId}`;
      const existingTimeout = remoteTypingTimeoutsRef.current.get(key);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      setTypingUsers((current) => ({
        ...current,
        [key]: {
          channelId: event.payload.channelId,
          userId: event.payload.actorId,
          userName: event.payload.userName
        }
      }));

      remoteTypingTimeoutsRef.current.set(
        key,
        setTimeout(() => {
          clearRemoteTypingKey(key);
        }, 2400)
      );
    });

    socket.on("message.typing.stopped", (event: EventEnvelope<"message.typing.stopped">) => {
      if (event.payload.actorId === userId) {
        return;
      }

      clearRemoteTypingKey(`${event.payload.actorId}:${event.payload.channelId}`);
    });

    return () => {
      emitTypingStop();
      socket.disconnect();
      socketRef.current = null;

      for (const timeout of remoteTypingTimeoutsRef.current.values()) {
        clearTimeout(timeout);
      }

      remoteTypingTimeoutsRef.current.clear();
    };
  }, [realtimeUrl, userId, userName, workspaceSlug]);

  useEffect(() => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit("channel:join", {
      workspaceId: workspaceSlug,
      channelId: activeChannelId,
      userId
    });
  }, [activeChannelId, userId, workspaceSlug]);

  function handleChannelSelect(channelId: string) {
    if (channelId === activeChannelId) {
      return;
    }

    emitTypingStop();
    setDraft("");
    setActiveChannelId(channelId);
  }

  function handleDraftChange(nextValue: string) {
    setDraft(nextValue);

    if (!socketRef.current) {
      return;
    }

    if (!nextValue.trim()) {
      emitTypingStop();
      return;
    }

    if (!isTypingRef.current) {
      socketRef.current.emit("typing:start", {
        workspaceId: workspaceSlug,
        channelId: activeChannelId,
        actorId: userId,
        userName
      });

      isTypingRef.current = true;
      typingChannelRef.current = activeChannelId;
    }

    scheduleTypingStop(activeChannelId);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();

    if (!body || !socketRef.current) {
      return;
    }

    socketRef.current.emit("message:send", {
      workspaceId: workspaceSlug,
      channelId: activeChannelId,
      actorId: userId,
      authorName: userName,
      messageId: crypto.randomUUID(),
      body
    });

    emitTypingStop(activeChannelId);
    setDraft("");
  }

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? channels[0];
  const channelMessages = messagesByChannel[activeChannelId] ?? [];
  const currentTypers = Object.values(typingUsers).filter((entry) => entry.channelId === activeChannelId);

  return (
    <main className="workspace-page">
      <section className="workspace-hero">
        <div>
          <p className="eyebrow">Phase 2 live workspace</p>
          <h1>{workspaceSlug}</h1>
        </div>
        <div className="hero-meta">
          <span>{userName}</span>
          <span>{socketStatus}</span>
          <span>live chat + presence</span>
        </div>
      </section>

      <section className="workspace-grid workspace-grid-live">
        <aside className="workspace-sidebar panel-chrome">
          <p className="column-label">Realtime Layer</p>
          <div className="stack">
            <div className="sidebar-card accent-coral">
              <strong>Live channels</strong>
              <span>Messages fan out instantly across active clients.</span>
            </div>
            <div className="sidebar-card accent-sand">
              <strong>Typing signals</strong>
              <span>Remote typing clears itself even when someone disconnects.</span>
            </div>
            <div className="sidebar-card accent-teal">
              <strong>Presence map</strong>
              <span>Each user shows their current active channel in the workspace.</span>
            </div>
          </div>
        </aside>

        <section className="workspace-column panel-chrome">
          <p className="column-label">Channels</p>
          <div className="stack">
            {channels.map((channel) => (
              <button
                className={`channel-button ${channel.id === activeChannelId ? "active" : ""}`}
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                type="button"
              >
                <strong>#{channel.name}</strong>
                <span>{channel.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="workspace-chat panel-chrome">
          <div className="chat-header">
            <div>
              <p className="column-label">Active channel</p>
              <h2>#{activeChannel?.name}</h2>
              <p className="panel-copy">{activeChannel?.description}</p>
            </div>
            <span className={`status-badge status-${socketStatus}`}>{socketStatus}</span>
          </div>

          <div className="message-feed">
            {channelMessages.map((message) => {
              const mine = message.authorId === userId;

              return (
                <article className={`message-card ${mine ? "mine" : ""}`} key={message.id}>
                  <div className="message-meta">
                    <strong>{mine ? "You" : message.authorName}</strong>
                    <span>{new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p>{message.body}</p>
                </article>
              );
            })}
          </div>

          <div className="chat-footer">
            <p className="typing-line">
              {currentTypers.length > 0
                ? `${currentTypers.map((entry) => entry.userName).join(", ")} typing...`
                : "No one is typing right now."}
            </p>
            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                onChange={(event) => handleDraftChange(event.target.value)}
                placeholder={`Message #${activeChannel?.name}`}
                rows={3}
                value={draft}
              />
              <button className="primary-button" disabled={socketStatus !== "online" || !draft.trim()} type="submit">
                Send message
              </button>
            </form>
          </div>
        </section>

        <aside className="workspace-sidebar panel-chrome right-rail">
          <p className="column-label">Workspace pulse</p>
          <div className="stack">
            {presence.map((member) => (
              <article className="member-card" key={member.userId}>
                <div className="presence-dot" />
                <div>
                  <strong>{member.userName}</strong>
                  <p>
                    {member.activeSurface.startsWith("channel-")
                      ? `active in #${channels.find((channel) => channel.id === member.activeSurface)?.name ?? member.activeSurface}`
                      : member.activeSurface}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="stack support-stack">
            <p className="column-label">Docs</p>
            {draftDocs.map((doc) => (
              <Link
                className="list-card compact doc-link"
                href={`/workspaces/${workspaceSlug}/docs/${doc.id}` as Route}
                key={doc.id}
              >
                <div>
                  <strong>{doc.title}</strong>
                  <p>{doc.presence}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="stack support-stack">
            <p className="column-label">Rooms</p>
            {draftRooms.map((room) => (
              <article className="list-card compact" key={room.id}>
                <div>
                  <strong>{room.name}</strong>
                  <p>{room.members}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}