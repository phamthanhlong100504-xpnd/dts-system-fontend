import { contentBuilderApi } from "@/lib/api";
import { CHAPTER_META } from "@/features/practice/practice-service";

export interface OfficialBankChapter {
  id: string;
  title: string;
  number?: number;
  sourceChapterId?: string;
}

export interface OfficialBankQuestion {
  id: string;
  content: string;
  chapterId?: string;
  chapterIds: string[];
  chapterNumber?: number;
  isCritical: boolean;
  options: Array<{ id?: string; text: string; isCorrect?: boolean }>;
  explanation?: string;
  mediaFileIds: string[];
  displayNo?: string | number;
}

export interface OfficialBank {
  bankVersion: string;
  licenseClass: string;
  chapters: OfficialBankChapter[];
  questions: OfficialBankQuestion[];
}

type RecordData = Record<string, unknown>;
const obj = (value: unknown): RecordData => typeof value === "object" && value !== null && !Array.isArray(value) ? value as RecordData : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const str = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
const numeric = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const first = (...candidates: unknown[]): string | undefined => candidates.map(str).find(Boolean);

export async function fetchOfficialBank(bankVersion: string, licenseClass: string): Promise<OfficialBank> {
  const version = bankVersion.trim();
  const license = licenseClass.trim().toUpperCase();
  if (!version || !license) throw new Error("Chưa chọn hạng GPLX hoặc phiên bản ngân hàng.");
  const raw = obj(await contentBuilderApi.get<unknown>(`/v1/internal/questions/bank?bankVersion=${encodeURIComponent(version)}&licenseClass=${encodeURIComponent(license)}`));
  if (raw.bankVersion !== version || raw.licenseClass !== license || !Array.isArray(raw.chapters) || !Array.isArray(raw.questions)) {
    throw new Error("Content Builder trả thiếu chapters/questions hoặc phiên bản ngân hàng, hạng GPLX không khớp. Không hiển thị dữ liệu giả.");
  }
  const chapters: OfficialBankChapter[] = list(raw.chapters).map((item, index) => {
    const r = obj(item);
    const chapterNo = numeric(r.chapterNumber) ?? numeric(r.number) ?? index + 1;
    const userChapterName = CHAPTER_META[String(chapterNo)]?.name;
    return {
      id: first(r.id, r.chapterId) ?? "",
      title: first(r.title, r.chapterTitle, r.name) ?? userChapterName ?? `Chương ${chapterNo}`,
      number: chapterNo,
      sourceChapterId: first(r.sourceChapterId) ?? (numeric(r.sourceChapterId) !== undefined ? String(numeric(r.sourceChapterId)) : undefined),
    };
  }).filter((item) => item.id);
  const questions: OfficialBankQuestion[] = list(raw.questions).map((item) => {
    const r = obj(item);
    const metadata = obj(r.metadata);
    const chapterIds = list(r.chapterIds).filter((x): x is string => Boolean(str(x)));
    const singleChapterId = first(r.chapterId, metadata.chapterId);
    if (singleChapterId && !chapterIds.includes(singleChapterId)) chapterIds.push(singleChapterId);
    const matchingChapter = chapters.find((c) => chapterIds.includes(c.id) || (c.sourceChapterId !== undefined && chapterIds.includes(c.sourceChapterId)));
    return {
      id: first(r.id, r.questionId) ?? "",
      content: first(r.content, r.questionText, r.text, r.title) ?? "",
      chapterId: matchingChapter?.id ?? singleChapterId,
      chapterIds,
      chapterNumber: numeric(r.chapterNumber) ?? numeric(r.chapter) ?? numeric(metadata.chapterNumber),
      isCritical: r.isCritical === true || metadata.isCritical === true,
      options: list(r.options).map((option) => {
        const o = obj(option);
        return { id: first(o.id, o.optionId), text: first(o.content, o.text) ?? "(Không có nội dung)", isCorrect: o.isCorrect === true };
      }),
      explanation: first(r.explanation, obj(r.explanations).text),
      mediaFileIds: list(r.mediaFileIds).filter((x): x is string => typeof x === "string"),
      displayNo: typeof r.number === "number" || typeof r.number === "string" ? r.number : undefined,
    };
  }).filter((q) => q.id);
  if (chapters.length !== raw.chapters.length || questions.length !== raw.questions.length) {
    throw new Error("Ngân hàng Content Builder thiếu ID chương hoặc ID câu hỏi. Không sử dụng nguồn chưa hợp lệ.");
  }
  return { bankVersion: version, licenseClass: license, chapters, questions };
}

export async function fetchOfficialBankDetails(bank: OfficialBank, signal?: AbortSignal): Promise<OfficialBank> {
  const ids = bank.questions.map((q) => q.id);
  if (ids.length === 0) return bank;
  if (new Set(ids).size !== ids.length) throw new Error("Content Builder trả questionId trùng trong BANK_VERSION.");
  const batchSize = 40;
  const batches: string[][] = [];
  for (let start = 0; start < ids.length; start += batchSize) batches.push(ids.slice(start, start + batchSize));
  const details = new Map<string, RecordData>();
  const parallelism = Math.min(3, batches.length);
  let cursor = 0;

  async function worker() {
    while (cursor < batches.length) {
      const batch = batches[cursor++];
      const result = await contentBuilderApi.post<unknown>("/v1/internal/questions/batch", batch, { signal });
      if (!Array.isArray(result)) throw new Error("API questions/batch không trả danh sách câu hỏi.");
      const requested = new Set(batch);
      for (const raw of result) {
        const row = obj(raw);
        const id = first(row.id, row.questionId);
        if (!id || !requested.has(id) || details.has(id)) {
          throw new Error("API questions/batch trả UUID không thuộc yêu cầu hoặc trùng lặp.");
        }
        details.set(id, row);
      }
      if (result.length !== batch.length) {
        throw new Error(`API questions/batch thiếu ${batch.length - result.length} câu nguồn; không hiển thị dữ liệu không đầy đủ.`);
      }
    }
  }
  await Promise.all(Array.from({ length: parallelism }, () => worker()));

  const questions = bank.questions.map((question) => {
    const row = details.get(question.id);
    if (!row) throw new Error(`Content Builder chưa trả chi tiết câu ${question.id}.`);
    const content = first(row.content, row.questionText, row.text);
    if (!content) throw new Error(`Câu ${question.id} chưa có nội dung ở questions/batch.`);
    const options = list(row.options).map((value) => {
      const option = obj(value);
      return {
        id: first(option.id, option.optionId),
        text: first(option.content, option.text) ?? "",
        isCorrect: option.isCorrect === true,
        order: numeric(option.sortOrder),
      };
    });
    if (options.length === 0 || options.some((option) => !option.id || !option.text)) {
      throw new Error(`Câu ${question.id} có danh sách đáp án thiếu ID/nội dung.`);
    }
    // Preserve a source-defined option ordering if supplied. Never infer a new option ID.
    const originalOrder = list(row.optionIds).filter((x): x is string => typeof x === "string");
    const ordered = options.slice().sort((a, b) => {
      if (originalOrder.length) return originalOrder.indexOf(a.id ?? "") - originalOrder.indexOf(b.id ?? "");
      return (a.order ?? 0) - (b.order ?? 0);
    });
    const explanations = row.explanations;
    const pieces = (Array.isArray(explanations) ? explanations : [explanations]).map((value) => {
      if (typeof value === "string") return value.trim();
      const o = obj(value);
      return first(o.content, o.text, o.explanation, o.description) ?? "";
    }).filter(Boolean);
    const explanation = first(row.explanation) ?? (pieces.length ? pieces.join("\n") : undefined);
    return {
      ...question,
      content,
      options: ordered.map(({ id, text, isCorrect }) => ({ id, text, isCorrect })),
      isCritical: row.isCritical === true || question.isCritical,
      explanation,
      mediaFileIds: list(row.mediaFileIds).filter((x): x is string => typeof x === "string"),
    };
  });
  return { ...bank, questions };
}
