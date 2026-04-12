import {
  defaultWorkspaceDocuments,
  documentBootstrapSchema,
  documentUpdateSchema,
  documentUpdatedSchema,
  type DocumentBootstrap,
  type DocumentUpdate,
  type DocumentUpdated,
  type WorkspaceDocumentSeed
} from "@worqly/shared";
import * as Y from "yjs";

type DocumentState = {
  meta: WorkspaceDocumentSeed;
  doc: Y.Doc;
  text: Y.Text;
  updatedAt: string;
};

function encodeUpdate(update: Uint8Array) {
  return Buffer.from(update).toString("base64");
}

function decodeUpdate(encodedUpdate: string) {
  return Uint8Array.from(Buffer.from(encodedUpdate, "base64"));
}

function createDocumentState(seed: WorkspaceDocumentSeed): DocumentState {
  const doc = new Y.Doc();
  const text = doc.getText("content");

  if (seed.initialContent) {
    text.insert(0, seed.initialContent);
  }

  return {
    meta: seed,
    doc,
    text,
    updatedAt: new Date().toISOString()
  };
}

function createFallbackSeed(documentId: string): WorkspaceDocumentSeed {
  const normalizedTitle = documentId
    .replace(/^doc-/, "")
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");

  const title = normalizedTitle || "Untitled doc";

  return {
    id: documentId,
    title,
    summary: "A shared workspace document created on demand.",
    initialContent: `${title}\n\nStart writing together in Worqly.`
  };
}

export class DocumentStore {
  private readonly workspaces = new Map<string, Map<string, DocumentState>>();

  private ensureWorkspace(workspaceId: string) {
    if (!this.workspaces.has(workspaceId)) {
      const documents = new Map<string, DocumentState>();

      for (const seed of defaultWorkspaceDocuments) {
        documents.set(seed.id, createDocumentState(seed));
      }

      this.workspaces.set(workspaceId, documents);
    }

    return this.workspaces.get(workspaceId)!;
  }

  private ensureDocument(workspaceId: string, documentId: string) {
    const workspace = this.ensureWorkspace(workspaceId);

    if (!workspace.has(documentId)) {
      workspace.set(documentId, createDocumentState(createFallbackSeed(documentId)));
    }

    return workspace.get(documentId)!;
  }

  bootstrap(workspaceId: string, documentId: string): DocumentBootstrap {
    return this.toBootstrap(workspaceId, this.ensureDocument(workspaceId, documentId));
  }

  applyUpdate(payload: DocumentUpdate): DocumentUpdated {
    const parsed = documentUpdateSchema.parse(payload);
    const state = this.ensureDocument(parsed.workspaceId, parsed.documentId);

    Y.applyUpdate(state.doc, decodeUpdate(parsed.encodedUpdate), "realtime-sync");
    state.updatedAt = new Date().toISOString();

    return documentUpdatedSchema.parse({
      ...parsed,
      updatedAt: state.updatedAt
    });
  }

  private toBootstrap(workspaceId: string, state: DocumentState): DocumentBootstrap {
    return documentBootstrapSchema.parse({
      workspaceId,
      documentId: state.meta.id,
      title: state.meta.title,
      summary: state.meta.summary,
      content: state.text.toString(),
      encodedState: encodeUpdate(Y.encodeStateAsUpdate(state.doc)),
      updatedAt: state.updatedAt
    });
  }
}