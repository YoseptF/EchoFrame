import { AudioLines } from "lucide-react";

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <AudioLines
        className="size-6 text-primary max-[380px]:hidden"
        strokeWidth={2.5}
      />
      <span className="text-xl font-semibold tracking-[-0.07em]">
        echoframe<span className="text-primary">.</span>
      </span>
    </span>
  );
}
