import type { CriticalQuestionsOverview } from "@/features/practice/critical-overview-types";
import { practiceApi } from "@/lib/api";

export async function getCriticalProgressOverview(
  licenseClass: string
): Promise<CriticalQuestionsOverview> {
  const normalizedLicense = licenseClass.trim().toUpperCase();

  return practiceApi.get<CriticalQuestionsOverview>(
    `/v1/questions/critical/overview?licenseClass=${encodeURIComponent(normalizedLicense)}`
  );
}