/** Frontend view models and adapter ports, not an asserted backend response schema.
 * Implementations must map an approved OpenAPI contract before the port is enabled.
 */
export type ResourceKind = 'theory-banks' | 'questions' | 'chapters' | 'programs' | 'traffic-signs' | 'memory-tips' | 'practice-sets' | 'simulation-banks' | 'simulation-chapters' | 'scenarios' | 'simulation-sets';
export type ContentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
export type Action = 'read' | 'create' | 'save' | 'validate' | 'submit' | 'approve' | 'reject' | 'publish' | 'archive' | 'clone' | 'restore' | 'media' | 'scoring';
export interface Scope { actorId: string; bankVersion: string; licenseClass: string; policyVersion: string }
export interface Choice { id: string; label: string }
export interface Page<T> { items: T[]; page: number; size: number; totalElements: number }
export interface Filter { page: number; size: number; keyword: string; bankVersion: string; licenseClass: string; chapterId: string; status: string; mediaStatus: string; critical: string; categoryId:string }
export interface Timeline { t5: string; t4: string; t3: string; t2: string; t1: string; end: string }
export interface Answer { id: string; text: string; correct: boolean }
export interface LinkedItem { id: string; title: string; bankVersion: string; chapterId: string; critical: boolean; mediaReady: boolean; durationMs?: number; code?:string; chapterLabel?:string; versionLabel?:string; statusLabel?:string; eligible?:boolean; unavailableReason?:string; href?:string }
export interface DraftContent {
  code: string; title: string; description: string; chapterId: string; licenseClasses: string[];
  mediaId: string; thumbnailId: string; videoDurationMs: number | null; timeline: Timeline;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'; answers: Answer[];
  explanation: string; critical: boolean; hazardSign: string; tip: string;
  categoryId: string; meaning: string; sortOrder: string; quickRule?:string; criticalLicenseClasses?:string[]; selected: LinkedItem[];
}
export interface ResourceRow { id: string; title: string; code: string; status: ContentStatus; bankVersion: string; versionNumber: number; updatedAt: string | null; chapterLabel?: string; durationMs?: number | null; mediaStatus?: string; count?: number | null;sourceId?:string;sortOrder?:number|null;licenseLabel?:string }
export interface Constraints { requiredCount: number | null; durationMs: number | null; maxScore: number | null; passingScore: number | null; chapterQuotas: Array<{ chapterId: string; label: string; required: number; criticalRequired?: number }>; separateApprover: boolean }
export interface ContentTreeNode {id:string;title:string;typeLabel:string;versionLabel:string;statusLabel:string;warning:string|null;children:ContentTreeNode[]}
export interface Snapshot { actorId: string; kind: ResourceKind; id: string; versionId: string; revision: number; row: ResourceRow; scope: Scope; content: DraftContent; actions: Action[]; constraints: Constraints; updatedBy: string | null; scoringVersion: string | null; sourceReference?:{origin:'STANDARD'|'CUSTOM';sourceId:string|null;sourceQuestionId:string|null;sourceImage:string|null;bankDraftHref:string|null;bankVersionId?:string};updatedByLabel?:string|null;approvedByLabel?:string|null;publishedVersionLabel?:string|null;tree?:ContentTreeNode[] }
export interface Issue { severity: 'ERROR' | 'WARNING'; message: string; field: string | null; itemId: string | null }
export interface Validation { actorId: string; versionId: string; revision: number; issues: Issue[]; canPublish: boolean; checkedAt: string; videoId: string | null; durationMs: number | null; summary?:Array<{label:string;value:string|number|null}>;breakdown?:Array<{label:string;required:number|null;actual:number|null}> }
export interface ScorePreview { versionId: string; revision: number; videoId: string; timestampMs: number; score: number; scoringVersion: string }
export interface HistoryRow { versionId: string; versionNumber: number; revision: number; status: ContentStatus; actorLabel: string; occurredAt: string; summary: string }
export interface Difference { field: string; before: string; after: string }
export interface Options { actorId: string; actions: Action[]; banks: Choice[]; licenses: Choice[]; chapters: Choice[]; policies: Choice[]; categories: Choice[]; statuses: Choice[] }
export interface MediaCandidate { mediaId: string; filename: string; target: 'QUESTION' | 'EXAM' | 'TRAFFIC_SIGN' | 'SIMULATION_VIDEO' | 'SIMULATION_THUMBNAIL'; status: 'READY' | 'UPLOADING' | 'FAILED'; mimeType: string; durationMs: number | null; visibility: 'PUBLIC' | 'PRIVATE' }
export interface MediaPlayback { mediaId: string; url: string; expiresAt: string | null }
export interface MediaReference { resourceId: string; versionId: string; label: string; status: string; href: string | null }
export interface CandidatePreview {id:string;title:string;description:string;chapterLabel:string;mediaId:string|null;thumbnailId:string|null;video:boolean;answers:Answer[];explanation:string;critical:boolean}
export interface ResourceSource {
  actorId: string;
  options(kind: ResourceKind, signal?: AbortSignal): Promise<Options>;
  list(kind: ResourceKind, filter: Filter, signal?: AbortSignal): Promise<Page<ResourceRow>>;
  detail(kind: ResourceKind, id: string, signal?: AbortSignal): Promise<Snapshot>;
  create(kind: ResourceKind, scope: Scope, sourceVersionId: string | null, initialContent?: DraftContent): Promise<Snapshot>;
  save(snapshot: Snapshot, content: DraftContent, expectedRevision: number): Promise<Snapshot>;
  validate(snapshot: Snapshot, expectedRevision: number): Promise<Validation>;
  transition(snapshot: Snapshot, action: Exclude<Action,'read'|'create'|'save'|'validate'|'media'|'scoring'>, expectedRevision: number, reason: string): Promise<Snapshot>;
  history(snapshot: Snapshot, signal?: AbortSignal): Promise<HistoryRow[]>;
  compare(snapshot: Snapshot, otherVersionId: string, signal?: AbortSignal): Promise<Difference[]>;
  candidates(snapshot: Snapshot, filter: Filter, signal?: AbortSignal): Promise<Page<LinkedItem>>;
  bankQuestion?: (bankVersionId:string,sourceQuestionId:string,signal?:AbortSignal)=>Promise<Snapshot>;
  candidateDetail?: (snapshot:Snapshot,itemId:string,signal?:AbortSignal)=>Promise<CandidatePreview>;
  mediaCandidates(snapshot: Snapshot, target: MediaCandidate['target'], page: number, signal?: AbortSignal): Promise<Page<MediaCandidate>>;
  mediaUrl(snapshot: Snapshot, mediaId: string, signal?: AbortSignal): Promise<MediaPlayback>;
  scorePreview(snapshot: Snapshot, expectedRevision: number, timestampMs: number): Promise<ScorePreview>;
  upload?: (snapshot: Snapshot, target: MediaCandidate['target'], file: File, onProgress: (percent: number) => void) => Promise<MediaCandidate>;
}
export const emptyFilter = (): Filter => ({page:0,size:20,keyword:'',bankVersion:'',licenseClass:'',chapterId:'',status:'',mediaStatus:'',critical:'',categoryId:''});
export const emptyContent = (): DraftContent => ({code:'',title:'',description:'',chapterId:'',licenseClasses:[],mediaId:'',thumbnailId:'',videoDurationMs:null,timeline:{t5:'',t4:'',t3:'',t2:'',t1:'',end:''},questionType:'SINGLE_CHOICE',answers:[],explanation:'',critical:false,hazardSign:'',tip:'',categoryId:'',meaning:'',sortOrder:'',quickRule:'',criticalLicenseClasses:[],selected:[]});
export const emptyOptions = (): Options => ({actorId:'',actions:[],banks:[],licenses:[],chapters:[],policies:[],categories:[],statuses:[]});
export const RESOURCE_LABELS: Record<ResourceKind,string> = {'theory-banks':'Phiên bản ngân hàng lý thuyết',questions:'Câu hỏi',chapters:'Chương lý thuyết',programs:'Chương trình học','traffic-signs':'Biển báo giao thông','memory-tips':'Mẹo ghi nhớ','practice-sets':'Bộ đề luyện tập','simulation-banks':'Ngân hàng mô phỏng','simulation-chapters':'Chương mô phỏng',scenarios:'Tình huống mô phỏng','simulation-sets':'Bộ đề mô phỏng'};
