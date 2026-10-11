import raw from "@/data/paths.json";

export type BusinessType = "online" | "store" | "service";

export type Landmark = "camp" | "gate" | "village" | "signpost" | "tower" | "echo" | "castle" | "summit";

export interface PathStep {
  id: string;
  /** Adventure-map name of the stage, e.g. "ค่ายฐาน". */
  place: string;
  icon: Landmark;
  /** Lifecycle group whose colour the stage takes (data/crm.json groups). */
  stage: string;
  when: string;
  title: string;
  goal: string;
  youWillFace: string[];
  doThis: string[];
  skipForNow: string;
  readyWhen: string;
  byType: Record<BusinessType, string>;
  topics: string[];
  /** Software categories (data/vendors) this step needs, and why. */
  tools?: { category: string; why: string }[];
  prompt: string;
}

/** A guided, time-ordered path through the topics for a particular reader (data/paths.json). */
export interface JourneyPath {
  slug: string;
  title: string;
  audience: string;
  intro: string;
  businessTypes: { id: BusinessType; label: string; desc: string }[];
  steps: PathStep[];
}

export const starterPath = raw as JourneyPath;
