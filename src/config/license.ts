
import type { LicenseCatalogItem } from "@/features/license/license-service";

export type LicenseGroupId =
  | "motorcycle"
  | "car"
  | "trailer";

export interface LicenseGroup {
  id: LicenseGroupId;
  label: string;
  shortLabel: string;
}

export interface LicenseOption {
  code: string;
  group: LicenseGroupId;
  description: string;

  title?: string;
  bankVersion?: string;
  bankCountsMatch?: boolean;
  examAvailable?: boolean;

  totalStudyQuestions: number;

  exam: {
    totalQuestions: number;
    durationMinutes: number;
    passingScore: number;
    criticalQuestionCount: number;
  };

  criticalStudyQuestions: number;
}

export const LICENSE_GROUPS: LicenseGroup[] = [
  {
    id: "motorcycle",
    label: "Mô tô",
    shortLabel: "Mô tô",
  },
  {
    id: "car",
    label: "Ô tô",
    shortLabel: "Ô tô",
  },
  {
    id: "trailer",
    label: "Ô tô kéo rơ moóc",
    shortLabel: "Rơ moóc",
  },
];

const BACKEND_GROUP_IDS: Record<
  LicenseCatalogItem["group"],
  LicenseGroupId
> = {
  "Mô tô": "motorcycle",
  "Ô tô": "car",
  "Rơ moóc": "trailer",
};

export function mapLicenseCatalogToOptions(
  catalog: readonly LicenseCatalogItem[]
): LicenseOption[] {
  return catalog.map((item) => {
    const group =
      BACKEND_GROUP_IDS[item.group];

    if (!group) {
      throw new Error(
        `Nhóm GPLX không hợp lệ: ${item.group}`
      );
    }

    return {
      code: item.code,
      group,

      title: item.title,
      description: item.description,

      bankVersion: item.bankVersion,

      totalStudyQuestions:
        item.totalStudyQuestions,

      criticalStudyQuestions:
        item.criticalStudyQuestions,

      exam: {
        totalQuestions:
          item.totalQuestions,

        durationMinutes:
          item.durationMinutes,

        passingScore:
          item.passingScore,

        criticalQuestionCount:
          item.criticalQuestionCount,
      },

      bankCountsMatch:
        item.bankCountsMatch,

      examAvailable:
        item.examAvailable,
    };
  });
}

export function getLicensesByGroup(
  group: LicenseGroupId,
  options: readonly LicenseOption[]
): LicenseOption[] {
  return options.filter(
    (license) =>
      license.group === group
  );
}

export function getLicenseByCode(
  code: string | null | undefined,
  options: readonly LicenseOption[]
): LicenseOption | undefined {
  if (!code) {
    return undefined;
  }

  return options.find(
    (license) =>
      license.code === code
  );
}
