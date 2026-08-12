import { getHubPage } from "@/lib/content/hub";
import { HubPage, hubMetadata } from "@/components/content/HubPage";

const page = getHubPage("split-chatgpt")!;

export const dynamic = "force-static";

export function generateMetadata() {
  return hubMetadata(page);
}

export default function SplitChatGptPage() {
  return <HubPage page={page} />;
}