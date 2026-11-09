import type { ApiClient } from "@/lib/api/http";
import { ApiError } from "@/lib/api/envelope";
import { SimulationGuideError } from "./simulation-guide-types";
import type {
  SimulationGuideSource,
  GuideAdminSnapshot,
  GuideRevision,
  PublishedGuide,
} from "./simulation-guide-types";
import type { GuideAccess } from "./simulation-guide-access";
import { guideEqual } from "./simulation-guide-content";
import {
  validateGuideAdmin,
  validateGuideHistory,
  validateGuideRevision,
  validatePublishedGuide,
} from "./simulation-guide-validation";
import {
  parseGuideWire,
  wireGuideAdmin,
  wireGuideCurrent,
  wireGuideHistory,
  wireGuideRevision,
  wireGuideSaveRequest,
  wireGuidePublishRequest,
} from "./simulation-guide-wire";
const base = "/v1/simulation-guide";
export function guideHttpError(
  error: unknown,
  current = false,
): SimulationGuideError {
  if (error instanceof SimulationGuideError) return error;
  const e = error instanceof ApiError ? error : null;
  const status = e?.status,
    code = e?.errorCode;
  const kind =
    status === 401
      ? "UNAUTHORIZED"
      : status === 403
        ? "FORBIDDEN"
        : status === 400
          ? "VALIDATION"
          : status === 404 && current && code === "GUIDE-404-UNPUBLISHED"
            ? "UNPUBLISHED"
            : status === 409 && code === "GUIDE-409-BANK"
              ? "BANK_CHANGED"
              : status === 409
                ? "CONFLICT"
                : status === 503
                  ? "UNAVAILABLE"
                  : "UNKNOWN";
  return new SimulationGuideError(
    kind,
    e?.message ?? "Không thể xác nhận nội dung hướng dẫn. Vui lòng thử lại.",
    status,
    code,
    e?.traceId,
  );
}
export function createSimulationGuideHttpSource(
  api: ApiClient,
  assertSession: (actorId: string, action: GuideAccess) => void,
): SimulationGuideSource {
  async function read<T>(
    actorId: string,
    action: GuideAccess,
    path: string,
    schema: import("zod").ZodType<T>,
    params?: object,
  ): Promise<T> {
    try {
      assertSession(actorId, action);
      const value = parseGuideWire(
        schema,
        await api.get<unknown>(base + path, {
          params,
          headers: { "Cache-Control": "no-cache" },
        }),
      );
      assertSession(actorId, action);
      return value;
    } catch (e) {
      throw guideHttpError(e, path === "/current");
    }
  }
  async function admin(actorId: string) {
    const value = await read(actorId, "read", "/admin", wireGuideAdmin);
    validateGuideAdmin(value, actorId);
    return value;
  }
  async function write(
    actorId: string,
    kind: "save" | "publish",
    request: unknown,
  ): Promise<GuideAdminSnapshot> {
    let body;
    try {
      body =
        kind === "save"
          ? parseGuideWire(wireGuideSaveRequest, request)
          : parseGuideWire(wireGuidePublishRequest, request);
    } catch (error) {
      throw new SimulationGuideError(
        "VALIDATION",
        error instanceof Error ? error.message : "Nội dung chưa hợp lệ.",
        400,
        "GUIDE-400",
      );
    }
    const action = kind === "save" ? "update" : "publish";
    assertSession(actorId, action);
    try {
      const response =
        kind === "save"
          ? await api.put<unknown>(base + "/admin/draft", body)
          : await api.post<unknown>(base + "/admin/publish", body);
      assertSession(actorId, action);
      const next = parseGuideWire(wireGuideAdmin, response);
      validateGuideAdmin(next, actorId);
      if (
        kind === "save"
          ? next.revision !== body.expectedRevision + 1 ||
            !("content" in body) ||
            !guideEqual(next.draft?.content, body.content)
          : next.revision !== body.expectedRevision ||
            next.published?.revision !== body.expectedRevision ||
            !guideEqual(next.draft?.content, next.published?.content)
      )
        throw new SimulationGuideError(
          "UNCERTAIN",
          "Phản hồi không khớp bản vừa gửi. Hãy tải lại để đối chiếu.",
        );
      return next;
    } catch (error) {
      assertSession(actorId, action);
      if (
        error instanceof SimulationGuideError &&
        ["UNAUTHORIZED", "FORBIDDEN"].includes(error.code)
      )
        throw error;
      if (error instanceof ApiError && error.status && error.status < 500)
        throw guideHttpError(error);
      try {
        // No resend. A failed response may follow a committed write.
        const observed = await admin(actorId);
        const confirmed =
          kind === "save"
            ? observed.revision === body.expectedRevision + 1 &&
              "content" in body &&
              guideEqual(observed.draft?.content, body.content)
            : observed.revision === body.expectedRevision &&
              observed.published?.revision === body.expectedRevision &&
              guideEqual(observed.draft?.content, observed.published?.content);
        if (confirmed) return observed;
      } catch (readError) {
        if (
          readError instanceof SimulationGuideError &&
          ["UNAUTHORIZED", "FORBIDDEN"].includes(readError.code)
        )
          throw readError;
      }
      throw new SimulationGuideError(
        "UNCERTAIN",
        "Chưa xác nhận được thao tác sau khi đọc lại server. Nội dung đang nhập được giữ nguyên; hãy tải lại và đối chiếu trước khi ghi tiếp.",
      );
    }
  }
  return {
    current: async (scope) => {
      const value: PublishedGuide = await read(
        scope.userId,
        "current",
        "/current",
        wireGuideCurrent,
        {
          licenseClass: scope.licenseClass,
          ...(scope.bankVersion ? { bankVersion: scope.bankVersion } : {}),
        },
      );
      validatePublishedGuide(value);
      if (
        value.scope.userId !== scope.userId ||
        value.scope.licenseClass !== scope.licenseClass ||
        (scope.bankVersion && value.scope.bankVersion !== scope.bankVersion)
      )
        throw new SimulationGuideError(
          "UNKNOWN",
          "Hướng dẫn không khớp tài khoản, hạng hoặc ngân hàng.",
        );
      return value;
    },
    admin,
    saveDraft: (actor, request) => write(actor, "save", request),
    publish: (actor, request) => write(actor, "publish", request),
    preview: async (actor) => {
      const value = await read(
        actor,
        "read",
        "/admin/preview",
        wireGuideRevision,
      );
      validateGuideRevision(value);
      if (value.status !== "DRAFT")
        throw new SimulationGuideError(
          "UNKNOWN",
          "Bản xem trước không phải nháp đã lưu.",
        );
      return value;
    },
    history: async (actor) => {
      const value = await read(
        actor,
        "read",
        "/admin/versions",
        wireGuideHistory,
      );
      validateGuideHistory(value, actor);
      return value;
    },
    version: async (actor, revision): Promise<GuideRevision> => {
      if (!Number.isSafeInteger(revision) || revision < 1)
        throw new SimulationGuideError(
          "VALIDATION",
          "Phiên bản lịch sử không hợp lệ.",
        );
      const value = await read(
        actor,
        "read",
        `/admin/versions/${revision}`,
        wireGuideRevision,
      );
      validateGuideRevision(value);
      if (value.revision !== revision || value.status === "DRAFT")
        throw new SimulationGuideError(
          "UNKNOWN",
          "Phiên bản lịch sử không khớp yêu cầu.",
        );
      return value;
    },
  };
}
