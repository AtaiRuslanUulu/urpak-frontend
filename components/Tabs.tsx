"use client";

export interface TabItem {
  key: string;
  label: string;
}

interface Props {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition ${
              isActive
                ? "border-primary font-medium text-fg"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
