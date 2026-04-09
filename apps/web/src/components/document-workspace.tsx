"use client";

import {
  defaultWorkspaceDocuments,
  documentBootstrapSchema,
  documentSurfaceId,
  documentUpdatedSchema,
  type DocumentBootstrap,
  type DocumentUpdated,
  type PresenceState,
  type WorkspaceBootstrap
} from "@worqly/shared";
import Link from "next/link";
import type { Route } from "next";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import * as Y from "yjs";

type DocumentWorkspaceProps = {
  workspaceSlug: string;
  documentId: string;
  userId: string;
  userName: string;
  realtimeUrl: string;
};

function encodeUpdate(update: Uint8Array) {
  let binary = "";

  for (const byte of update) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeUpdate(encodedUpdate: string) {
  const binary = atob(encodedUpdate);
  const update = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    update[index] = binary.charCodeAt(index);
  }

  return update;
}

function applyPlainTextChange(text: Y.Text, nextValue: string) {
  const currentValue = text.toString();

  if (currentValue === nextValue) {
    return;
  }

  let start = 0;

  while (
    start < currentValue.length &&
    start < nextValue.length &&
    currentValue[start] === nextValue[start]
  ) {
    start += 1;
  }

  let currentEnd = currentValue.length - 1;
  let nextEnd = nextValue.length - 1;

  while (
    currentEnd >= start &&
    nextEnd >= start &&
    currentValue[currentEnd] === nextValue[nextEnd]
  ) {
    currentEnd -= 1;
    nextEnd -= 1;
  }

  const deleteLength = currentEnd - start + 1;
  const insertValue = nextValue.slice(start, nextEnd + 1);

  if (deleteLength > 0) {
    text.delete(start, deleteLength);
  }

  if (insertValue) {
    text.insert(start, insertValue);
  }
}

export function DocumentWorkspace({
  documentId,
  realtimeUrl,
  userId,
  userName,
  workspaceSlug
}: DocumentWorkspaceProps) {
  const fallbackDocument =
    defaultWorkspaceDocuments.find((document) => document.id === documentId) ??
    defaultWorkspaceDocuments[0];

  const [socketStatus, setSocketStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [presence, setPresence] = useState<PresenceState[]>([]);
  const [title, setTitle] = useState(fallbackDocument.title);
  const [summary, setSummary] = useState(fallbackDocument.summary);
  const [content, setContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const documentRef = useRef<Y.Doc | null>(null);
  const textRef = useRef<Y.Text | null>(null);

  function setupDocument(snapshot: DocumentBootstrap) {
    documentRef.current?.destroy();

    const doc = new Y.Doc();
    const text = doc.getText("content");

    text.observe(() => {
      setContent(text.toString());
    });

    doc.on("update", (update, origin) => {
      if (origin !== "local-editor") {
        return;
      }

      socketRef.current?.emit("document:update", {
        workspaceId: workspaceSlug,
        documentId,
        actorId: userId,
        actorName: userName,
        encodedUpdate: encodeUpdate(update)
      });

      setUpdatedAt(new Date().toISOString());
    });

    Y.applyUpdate(doc, decodeUpdate(snapshot.encodedState), "bootstrap-sync");

    documentRef.current = doc;
    textRef.current = text;

    setTitle(snapshot.title);
    setSummary(snapshot.summary);
    setContent(snapshot.content);
    setUpdatedAt(snapshot.updatedAt);
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
        activeSurface: documentSurfaceId(documentId)
      });
    });

    socket.on("disconnect", () => {
      setSocketStatus("offline");
    });

    socket.on("workspace.bootstrap", (_payload: WorkspaceBootstrap) => {
      socket.emit("document:join", {
        workspaceId: workspaceSlug,
        documentId,
        userId,
        userName
      });
    });

    socket.on("presence.updated", (nextPresence: PresenceState[]) => {
      setPresence(nextPresence);
    });

    socket.on("document.bootstrap", (payload: DocumentBootstrap) => {
      setupDocument(documentBootstrapSchema.parse(payload));
    });

    socket.on("document.updated", (payload: DocumentUpdated) => {
      const update = documentUpdatedSchema.parse(payload);

      if (!documentRef.current || update.actorId === userId) {
        return;
      }

      Y.applyUpdate(documentRef.current, decodeUpdate(update.encodedUpdate), "remote-sync");
      setUpdatedAt(update.updatedAt);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      documentRef.current?.destroy();
      documentRef.current = null;
      textRef.current = null;
    };
  }, [documentId, realtimeUrl, userId, userName, workspaceSlug]);

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;

    setContent(nextValue);

    if (!textRef.current) {
      return;
    }

    textRef.current.doc?.transact(() => {
      applyPlainTextChange(textRef.current!, nextValue);
    }, "local-editor");
  }

  const collaborators = presence.filter(
    (entry) => entry.activeSurface === documentSurfaceId(documentId)
  );

  return (
    <main className="document-page">
      <section className="workspace-hero">
        <div>
          <p className="eyebrow">Phase 3 collaborative docs</p>
          <h1>{workspaceSlug}</h1>
        </div>
        <div className="hero-meta">
          <span>{userName}</span>
          <span>{socketStatus}</span>
          <span>live document sync</span>
        </div>
      </section>

      <section className="document-layout">
        <aside className="panel-chrome document-sidebar">
          <p className="column-label">Docs</p>
          <div className="stack">
            {defaultWorkspaceDocuments.map((document) => (
              <Link
                className={`doc-nav-link ${document.id === documentId ? "active" : ""}`}
                href={`/workspaces/${workspaceSlug}/docs/${document.id}` as Route}
                key={document.id}
              >
                <strong>{document.title}</strong>
                <span>{document.summary}</span>
              </Link>
            ))}
          </div>
          <Link className="back-link" href={`/workspaces/${workspaceSlug}` as Route}>
            Back to workspace
          </Link>
        </aside>

        <section className="panel-chrome document-editor-panel">
          <div className="document-header">
            <div>
              <p className="column-label">Shared document</p>
              <h2>{title}</h2>
              <p className="panel-copy">{summary}</p>
            </div>
            <span className={`status-badge status-${socketStatus}`}>{socketStatus}</span>
          </div>
          <textarea
            className="document-editor"
            onChange={handleContentChange}
            placeholder="Start typing together..."
            value={content}
          />
        </section>

        <aside className="panel-chrome document-meta-panel">
          <p className="column-label">Collaboration</p>
          <div className="stack">
            {collaborators.length > 0 ? (
              collaborators.map((collaborator) => (
                <article className="member-card" key={collaborator.userId}>
                  <div className="presence-dot" />
                  <div>
                    <strong>{collaborator.userName}</strong>
                    <p>editing this document right now</p>
                  </div>
                </article>
              ))
            ) : (
              <article className="list-card compact">
                <div>
                  <strong>Only you for now</strong>
                  <p>Open this same doc in another tab to test live collaboration.</p>
                </div>
              </article>
            )}
          </div>

          <div className="stack support-stack">
            <p className="column-label">Doc status</p>
            <article className="list-card compact">
              <div>
                <strong>Realtime sync</strong>
                <p>Edits merge live through the shared Yjs document state.</p>
              </div>
            </article>
            <article className="list-card compact">
              <div>
                <strong>Last update</strong>
                <p>
                  {updatedAt
                    ? new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Waiting for first sync"}
                </p>
              </div>
            </article>
          </div>
        </aside>
      </section>
    </main>
  );
}