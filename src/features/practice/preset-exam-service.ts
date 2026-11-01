import {
  practiceApi,
} from "@/lib/api";

import type {
  PresetExamSetList,
  StartPresetExamRequest,
  StartPresetExamResponse,
} from "@/features/practice/preset-exam-types";

import {
  useAuthStore,
} from "@/stores/auth-store";

export interface GetPresetExamSetsParams {
  licenseClass: string;
}

export async function getPresetExamSets({
  licenseClass,
}: GetPresetExamSetsParams): Promise<PresetExamSetList> {
  const normalizedLicense =
    licenseClass
      .trim()
      .toUpperCase();

  if (!normalizedLicense) {
    return {
      licenseClass: "",
      items: [],
      total: 0,
    };
  }

  const data =
    await practiceApi.get<PresetExamSetList>(
      `/v1/exams/presets?licenseClass=${encodeURIComponent(
        normalizedLicense
      )}`
    );

  return data;
}

export async function startPresetExam(
  payload: StartPresetExamRequest
): Promise<StartPresetExamResponse> {
  const fullName =
    useAuthStore
      .getState()
      .user
      ?.fullName
      ?.trim();

  const body = {
    mode: payload.mode,

    ...(fullName
      ? {
          fullName,
        }
      : {}),
  };

  const data =
    await practiceApi.post<StartPresetExamResponse>(
      `/v1/exams/presets/${encodeURIComponent(
        payload.presetExamSetId
      )}/sessions`,
      body
    );

  return data;
}