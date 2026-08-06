import type { components as IdentityComponents } from "@/types/identity.generated";
import type { components as PracticeComponents } from "@/types/practice.generated";
import type { components as ProgressComponents } from "@/types/progress.generated";

/** Schemas của 3 service (sinh tự động từ OpenAPI) */
export type IdentitySchemas = IdentityComponents["schemas"];
export type PracticeSchemas = PracticeComponents["schemas"];
export type ProgressSchemas = ProgressComponents["schemas"];
