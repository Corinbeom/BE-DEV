const prompts = [
  "왜 서류에서 계속 탈락하는 것 같아?",
  "이 JD에 내가 맞는지 분석해줘\n\n[JD 붙여넣기]",
  "이번 주 뭘 집중해야 할까?",
  "내 강점이 뭔지 알려줘",
];

export function SuggestedPrompts({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {prompt.split("\n")[0]}
        </button>
      ))}
    </div>
  );
}
