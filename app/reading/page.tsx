import ReadingClient from "./ReadingClient";

type ReadingPageProps = {
  searchParams: Promise<{ spread?: string | string[] }>;
};

export default async function ReadingPage({ searchParams }: ReadingPageProps) {
  const params = await searchParams;
  const spreadId = typeof params.spread === "string" ? params.spread : "daily";
  return <ReadingClient initialSpreadId={spreadId} />;
}
