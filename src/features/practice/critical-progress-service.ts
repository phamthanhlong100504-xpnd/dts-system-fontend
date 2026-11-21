import type { CriticalQuestionsOverview } from "@/features/practice/critical-overview-types";
import { progressApi } from "@/lib/api";

export async function getCriticalProgressOverview(
  licenseClass: string
): Promise<CriticalQuestionsOverview> {
  const normalizedLicense = licenseClass.trim().toUpperCase();

  return progressApi.get<CriticalQuestionsOverview>(
    `/v1/questions/critical/overview?licenseClass=${encodeURIComponent(normalizedLicense)}`
  );
}
