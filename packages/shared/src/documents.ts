import { z } from "zod";

export const workspaceDocumentSeedSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  initialContent: z.string()
});

export type WorkspaceDocumentSeed = z.infer<typeof workspaceDocumentSeedSchema>;

export const defaultWorkspaceDocuments: WorkspaceDocumentSeed[] = [
  {
    id: "doc-roadmap",
    title: "Worqly v1 roadmap",
    summary: "High-level product goals, rollout notes, and the next decisions queued up.",
    initialContent:
      "Worqly roadmap\n\n- Phase 1 foundation completed\n- Phase 2 live chat and presence completed\n- Phase 3 collaborative docs in progress\n\nUse this space for shared planning, launch notes, and quick async edits."
  },
  {
    id: "doc-onboarding",
    title: "Workspace onboarding",
    summary: "The starting checklist for new teammates joining the workspace for the first time.",
    initialContent:
      "Workspace onboarding\n\n1. Create your account\n2. Join the workspace\n3. Check the live channels\n4. Open the shared docs\n\nKeep this page updated as the product grows."
  },
  {
    id: "doc-architecture",
    title: "Realtime event glossary",
    summary: "A compact reference for the message, presence, and document events running the app.",
    initialContent:
      "Realtime event glossary\n\nmessage.sent\nmessage.typing.started\nmessage.typing.stopped\npresence.updated\ndocument.updated\n\nUse this doc to keep the event language easy to explain."
  }
] satisfies WorkspaceDocumentSeed[];

export const documentJoinSchema = z.object({
  workspaceId: z.string().min(1),
  documentId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1)
});

export type DocumentJoinPayload = z.infer<typeof documentJoinSchema>;

export const documentBootstrapSchema = z.object({
  workspaceId: z.string().min(1),
  documentId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  content: z.string(),
  encodedState: z.string().min(1),
  updatedAt: z.string().datetime()
});

export type DocumentBootstrap = z.infer<typeof documentBootstrapSchema>;

export const documentUpdateSchema = z.object({
  workspaceId: z.string().min(1),
  documentId: z.string().min(1),
  actorId: z.string().min(1),
  actorName: z.string().min(1),
  encodedUpdate: z.string().min(1)
});

export type DocumentUpdate = z.infer<typeof documentUpdateSchema>;

export const documentUpdatedSchema = documentUpdateSchema.extend({
  updatedAt: z.string().datetime()
});

export type DocumentUpdated = z.infer<typeof documentUpdatedSchema>;

export function documentSurfaceId(documentId: string) {
  return `doc:${documentId}`;
}