import { getHubPage } from "@/lib/content/hub";
import { HubPage, hubMetadata } from "@/components/content/HubPage";

const page = getHubPage("how-to-split-subscriptions")!;

export const dynamic = "force-static";

export function generateMetadata() {
  return hubMetadata(page);
}

export default function HowToSplitPage() {
  return <HubPage page={page} />;
}