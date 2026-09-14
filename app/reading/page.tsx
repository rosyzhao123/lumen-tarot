import ReadingClient from "./ReadingClient";
import { spreads } from "../tarot-data";

type ReadingPageProps = {
  searchParams: Promise<{ spread?: string }>;
};

export default async function ReadingPage({ searchParams }: ReadingPageProps) {
  let initialSpreadId = "daily";

  if (process.env.GITHUB_PAGES !== "true") {
    const requestedSpread = (await searchParams).spread;
    if (requestedSpread && spreads.some((spread) => spread.id === requestedSpread)) {
      initialSpreadId = requestedSpread;
    }
  }

  return <ReadingClient initialSpreadId={initialSpreadId} />;
}
