import { PracticeSetsPage } from "@/features/admin/practice-exam-sets/components/practice-sets-page";
export default async function Page({ searchParams }: { searchParams: Promise<{ licenseClass?: string }> }) { const query = await searchParams; return <PracticeSetsPage initialLicense={typeof query.licenseClass === "string" ? query.licenseClass : ""} />; }
