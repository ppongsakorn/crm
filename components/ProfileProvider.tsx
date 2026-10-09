"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Profile } from "@/lib/prompts";

/**
 * The visitor's business details and their own answers for prompt placeholders.
 * Kept only in this browser (localStorage) so prompts can be filled before copying.
 */
interface Ctx {
  profile: Profile;
  custom: Profile;
  setField: (id: string, value: string) => void;
  setCustom: (placeholder: string, value: string) => void;
  clear: () => void;
}

const KEY = "crm-prompt-profile";
const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ profile: Profile; custom: Profile }>({ profile: {}, custom: {} });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const v = JSON.parse(saved);
        setState({ profile: v.profile ?? {}, custom: v.custom ?? {} });
      }
    } catch {}
  }, []);

  const save = useCallback((next: { profile: Profile; custom: Profile }) => {
    setState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      setField: (id, v) => save({ ...state, profile: { ...state.profile, [id]: v } }),
      setCustom: (ph, v) => save({ ...state, custom: { ...state.custom, [ph.trim()]: v } }),
      clear: () => save({ profile: {}, custom: {} }),
    }),
    [state, save],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

const EMPTY: Ctx = { profile: {}, custom: {}, setField: () => {}, setCustom: () => {}, clear: () => {} };
export function useProfile(): Ctx {
  return useContext(ProfileContext) ?? EMPTY;
}
