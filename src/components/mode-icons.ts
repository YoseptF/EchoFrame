import { Image, Layers3, Presentation } from "lucide-react";
import type { FrameMode } from "@/lib/presentation";

export const modeIcons = {
  presentation: Presentation,
  backdrop: Image,
  spatial: Layers3,
} satisfies Record<FrameMode, unknown>;
