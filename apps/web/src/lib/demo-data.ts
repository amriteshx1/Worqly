export const draftChannels = [
  { id: "channel-design", name: "design-review", status: "active" },
  { id: "channel-build", name: "phase-1-build", status: "shipping" },
  { id: "channel-demo", name: "demo-script", status: "blocked" }
] as const;

export const draftDocs = [
  { id: "doc-roadmap", title: "Worqly v1 roadmap", presence: "2 editing" },
  { id: "doc-onboarding", title: "Workspace onboarding", presence: "1 viewing" },
  { id: "doc-architecture", title: "Realtime event glossary", presence: "idle" }
] as const;

export const draftRooms = [
  { id: "room-standup", name: "Daily standup", members: "3 joined" },
  { id: "room-review", name: "Review room", members: "empty" }
] as const;

export const draftMembers = [
  { id: "member-1", name: "Amritesh", state: "typing in #phase-1-build" },
  { id: "member-2", name: "Isha", state: "editing roadmap" },
  { id: "member-3", name: "Rian", state: "in Daily standup" }
] as const;

