import type {
  Question,
  QuestionOption,
} from "@/features/practice/practice-service";

export interface ChapterSessionQuestion
  extends Omit<
    Question,
    | "id"
    | "chapter"
    | "questionText"
    | "options"
  > {
  id: number;
  chapter: number;

  questionText: string;
  options: QuestionOption[];

  position: number;

  learned: boolean;
  bookmarked: boolean;

  selectedAnswer?: string;
  answered: boolean;
  isCorrect?: boolean;
}