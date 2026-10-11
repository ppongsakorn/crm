import raw from "@/data/paths.json";

export type BusinessType = "online" | "store" | "service";

export interface PathStep {
  id: string;
  when: string;
  title: string;
  goal: string;
  youWillFace: string[];
  doThis: string[];
  skipForNow: string;
  readyWhen: string;
  byType: Record<BusinessType, string>;
  topics: string[];
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
