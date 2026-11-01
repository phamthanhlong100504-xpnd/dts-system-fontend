import { SimulationExamPage } from "@/features/simulations/components/simulation-exam-pages";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const position =
    typeof query.position === "string" && /^(?:[1-9]|10)$/.test(query.position)
      ? Number(query.position)
      : 1;
  return (
    <SimulationExamPage
      screen="session"
      sessionId={sessionId}
      position={position}
    />
  );
}
