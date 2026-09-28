import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ProfileAvatar({
  name,
  picture,
  className,
}: {
  name: string;
  picture?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("rounded-lg", className)}>
      {picture && (
        <AvatarImage src={picture} alt="" referrerPolicy="no-referrer" />
      )}
      <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-semibold text-primary">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
