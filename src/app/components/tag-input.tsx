import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { normalizeTags } from "@/lib/library/library";

/** Edits a list of tags. Enter or a comma adds; suggestions come from the rest of the folder. */
export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
}: {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const add = (tags: string[]) => {
    onChange(normalizeTags([...value, ...tags]));
    setDraft("");
  };
  const remove = (tag: string) =>
    onChange(value.filter((item) => item !== tag));
  const unused = suggestions.filter((tag) => !value.includes(tag)).slice(0, 12);

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
      event.preventDefault();
      add(draft.split(","));
    } else if (event.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]!);
    }
  }

  return (
    <div className="grid gap-3">
      {value.length > 0 && (
        <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="gap-1 py-0.5 pr-0.5">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 rounded-full"
                  aria-label={`Remove ${tag}`}
                  onClick={() => remove(tag)}
                >
                  <X />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <InputGroup>
        <InputGroupInput
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKey}
          onBlur={() => draft.trim() && add(draft.split(","))}
          placeholder="water cycle, evaporation…"
          autoComplete="off"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="xs"
            disabled={!draft.trim()}
            onClick={() => add(draft.split(","))}
          >
            <Plus /> Add
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {unused.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">In this folder:</span>
          {unused.map((tag) => (
            <Badge key={tag} variant="outline" asChild>
              <button
                type="button"
                className="cursor-pointer hover:border-primary/40 hover:text-primary"
                onClick={() => add([tag])}
              >
                <Plus /> {tag}
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
