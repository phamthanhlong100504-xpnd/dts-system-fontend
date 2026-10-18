import { practiceApi } from "@/lib/api";

import type {
  WrongQuestionItem,
  WrongQuestionsOverview,
} from "@/features/practice/wrong-questions-types";

export interface GetWrongQuestionsParams {
  licenseClass: string;
}

function normalizeLicenseClass(
  licenseClass: string
) {
  return licenseClass
    .trim()
    .toUpperCase();
}

export async function getWrongQuestionsOverview({
  licenseClass,
}: GetWrongQuestionsParams): Promise<WrongQuestionsOverview> {
  const normalizedLicense =
    normalizeLicenseClass(
      licenseClass
    );

  if (!normalizedLicense) {
    return {
      licenseClass: "",
      totalWrongQuestions: 0,
      hasWrongQuestions: false,
    };
  }

  const data =
    await practiceApi.get<WrongQuestionsOverview>(
      `/v1/questions/wrong/overview?licenseClass=${encodeURIComponent(
        normalizedLicense
      )}`
    );

  return data;
}

export async function getWrongQuestions({
  licenseClass,
}: GetWrongQuestionsParams): Promise<WrongQuestionItem[]> {
  const normalizedLicense =
    normalizeLicenseClass(
      licenseClass
    );

  if (!normalizedLicense) {
    return [];
  }

  const data =
    await practiceApi.get<WrongQuestionItem[]>(
      `/v1/questions/wrong?licenseClass=${encodeURIComponent(
        normalizedLicense
      )}`
    );

  return data;
}