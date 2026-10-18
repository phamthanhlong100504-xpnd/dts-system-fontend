
import { identityApi, practiceApi } from "@/lib/api";

export type LicenseCatalogGroup =
  | "Mô tô"
  | "Ô tô"
  | "Rơ moóc";

export interface LicenseCatalogItem {
  code: string;
  group: LicenseCatalogGroup;
  title: string;
  description: string;

  bankVersion: string;

  totalStudyQuestions: number;
  criticalStudyQuestions: number;

  totalQuestions: number;
  durationMinutes: number;
  passingScore: number;
  criticalQuestionCount: number;

  bankCountsMatch: boolean;
  examAvailable: boolean;
}

export async function getLicenseCatalog(): Promise<
  LicenseCatalogItem[]
> {
  return practiceApi.get<LicenseCatalogItem[]>(
    "/v1/exams/license-catalog"
  );
}

export interface UserLicenseResponse {
  licenseClass: string;
}

export interface UpdateLicenseRequest {
  licenseClass: string;
}

export async function updateCurrentLicense(
  payload: UpdateLicenseRequest
): Promise<UserLicenseResponse> {
  return identityApi.put<UserLicenseResponse>(
    "/v1/users/me/license",
    payload
  );
}
