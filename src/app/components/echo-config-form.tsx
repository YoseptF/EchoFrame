import { useEffect, useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { modeIcons } from "@/components/mode-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  defaultEchoConfig,
  type EchoConfig,
  type Folder,
} from "@/lib/library/library";
import { modes, type FrameMode } from "@/lib/presentation";
import { useLibraryAction, useProfile } from "../library-context";

const heuristics = [
  {
    id: "relevance",
    name: "Relevance",
    description:
      "How closely material must match what you’re saying before it comes forward.",
  },
  {
    id: "recency",
    name: "Recency",
    description:
      "How much your latest sentence outweighs the rest of the speech window while you stay on one thought. When you change subject, the latest sentence leads.",
  },
  {
    id: "continuity",
    name: "Continuity",
    description:
      "How sure Jev must be that you’ve changed subject before the frame moves on. The frame never changes while you’re still on the same thought.",
  },
] as const;

const languages = [
  ["en-US", "English (US)"],
  ["en-GB", "English (UK)"],
  ["es-ES", "Español (España)"],
  ["es-MX", "Español (México)"],
  ["fr-FR", "Français"],
  ["de-DE", "Deutsch"],
  ["it-IT", "Italiano"],
  ["pt-BR", "Português (Brasil)"],
  ["ja-JP", "日本語"],
] as const;

function SliderField({
  id,
  label,
  description,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <div className="flex items-center justify-between gap-4">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className="text-sm font-medium text-primary tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([next]) => next !== undefined && onChange(next)}
        aria-label={label}
      />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}

/** How a folder's material becomes an echo: mode, timing, heuristics, language. */
export function EchoConfigForm({ folder }: { folder: Folder }) {
  const profile = useProfile();
  const act = useLibraryAction();
  const [config, setConfig] = useState<EchoConfig>(folder.config);
  const [busy, setBusy] = useState(false);
  const saved = JSON.stringify(folder.config);
  const dirty = JSON.stringify(config) !== saved;

  useEffect(() => setConfig(JSON.parse(saved)), [saved]);

  const set = <K extends keyof EchoConfig>(key: K, value: EchoConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await act(
      (library) => library.updateFolder(profile.id, folder.id, { config }),
      "Echo settings saved",
    );
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="xl:row-span-2">
        <CardHeader>
          <CardTitle>Mode</CardTitle>
          <CardDescription>
            How the frame is composed while you speak. You can switch during a
            session; this is where each session starts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.mode}
            onValueChange={(value) => set("mode", value as FrameMode)}
            aria-label="Mode"
          >
            {modes.map((mode) => {
              const Icon = modeIcons[mode.id];
              return (
                <FieldLabel key={mode.id} htmlFor={`mode-${mode.id}`}>
                  <Field orientation="horizontal">
                    <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                    <FieldContent>
                      <FieldTitle>
                        {mode.name}
                        <span className="font-normal text-muted-foreground">
                          · {mode.label}
                        </span>
                      </FieldTitle>
                      <FieldDescription>{mode.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={mode.id} id={`mode-${mode.id}`} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listening</CardTitle>
          <CardDescription>
            What counts as the current thought, and how often the frame may
            change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <SliderField
              id="window-seconds"
              label="Speech window"
              description="Recent speech considered when choosing material."
              value={config.windowSeconds}
              min={5}
              max={90}
              unit="s"
              onChange={(value) => set("windowSeconds", value)}
            />
            <SliderField
              id="hold-seconds"
              label="Minimum hold"
              description="The shortest time a frame stays up, so the audience can take it in before the next one."
              value={config.holdSeconds}
              min={1}
              max={60}
              unit="s"
              onChange={(value) => set("holdSeconds", value)}
            />
            <Field>
              <FieldLabel htmlFor="language">Speech language</FieldLabel>
              <Select
                value={config.language}
                onValueChange={(value) => set("language", value)}
              >
                <SelectTrigger id="language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selection heuristics</CardTitle>
          <CardDescription>
            The balance applied to Jev’s judgments when picking what comes next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {heuristics.map((heuristic) => (
              <SliderField
                key={heuristic.id}
                id={`weight-${heuristic.id}`}
                label={heuristic.name}
                description={heuristic.description}
                value={config.weights[heuristic.id]}
                min={0}
                max={100}
                onChange={(value) =>
                  set("weights", { ...config.weights, [heuristic.id]: value })
                }
              />
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2 xl:col-span-2">
        {dirty && (
          <span className="mr-auto text-sm text-muted-foreground">
            Unsaved changes
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfig(defaultEchoConfig)}
        >
          <RotateCcw /> Defaults
        </Button>
        <Button type="submit" disabled={!dirty || busy}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
