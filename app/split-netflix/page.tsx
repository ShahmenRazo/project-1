import { getHubPage } from "@/lib/content/hub";
import { HubPage, hubMetadata } from "@/components/content/HubPage";

const page = getHubPage("split-netflix")!;

export const dynamic = "force-static";

export function generateMetadata() {
  return hubMetadata(page);
}

export default function SplitNetflixPage() {
  return <HubPage page={page} />;
}