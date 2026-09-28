import { Compass } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "../components/app-shell";

export function NotFoundPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Library", href: "/" }, { label: "Not found" }]}
      />
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass />
          </EmptyMedia>
          <EmptyTitle>Nothing at this address</EmptyTitle>
          <EmptyDescription>
            The page you followed doesn’t exist in EchoFrame.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Back to your library</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </>
  );
}
