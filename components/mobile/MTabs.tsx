"use client";

import { useState, type ReactNode } from "react";

/** Segmented control that swaps panels in place, like a native tab strip. */
export function MTabs({ tabs, initial }: { tabs: { id: string; label: string; content: ReactNode }[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  return (
    <>
      <div className="m-seg" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => {
              setActive(t.id);
              window.scrollTo({ top: 0 });
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <section key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={active !== t.id} className="m-panel">
          {t.content}
        </section>
      ))}
    </>
  );
}
