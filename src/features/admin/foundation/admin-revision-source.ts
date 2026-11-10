import {contentBuilderApi} from '@/lib/api';
export type ChangeImpact='EDITORIAL'|'SCORING'|'POLICY';
export type RevisionStatus='DRAFT'|'IN_REVIEW'|'APPROVED'|'PUBLISHED'|'ARCHIVED';
export interface DraftMetadata {title:string;description:string;note:string}
export interface AdminRevision {
 versionId:string;resourceType:string;resourceId:string;versionNumber:number;revision:number;
 status:RevisionStatus;changeImpact:ChangeImpact;sourceVersionId:string|null;content:DraftMetadata;
 validationRevision:number|null;createdBy:string;createdAt:string;updatedBy:string;updatedAt:string;
 approvedBy:string|null;approvedAt:string|null;publishedBy:string|null;publishedAt:string|null;
}
export interface RevisionPage {content:AdminRevision[];number:number;size:number;totalElements:number}
const base='/v1/admin/revisions';
export const adminRevisionSource={
 list:(resourceType:string,page=0)=>contentBuilderApi.get<RevisionPage>(base,{params:{resourceType,page,size:20}}),
 detail:(id:string)=>contentBuilderApi.get<AdminRevision>(`${base}/${encodeURIComponent(id)}`),
 create:(resourceType:string,resourceId:string,changeImpact:ChangeImpact,content:DraftMetadata)=>
  contentBuilderApi.post<AdminRevision>(base,{resourceType,resourceId,changeImpact,content}),
 save:(r:AdminRevision,content:DraftMetadata)=>contentBuilderApi.put<AdminRevision>(`${base}/${encodeURIComponent(r.versionId)}`,
  {expectedRevision:r.revision,content}),
 validate:(r:AdminRevision)=>contentBuilderApi.post<{valid:boolean;checkedAt:string;revision:number;errors:string[]}>(
  `${base}/${encodeURIComponent(r.versionId)}/validate`,{expectedRevision:r.revision}),
 transition:(r:AdminRevision,action:'submit'|'approve'|'reject',reason:string)=>
  contentBuilderApi.post<AdminRevision>(`${base}/${encodeURIComponent(r.versionId)}/${action}`,{expectedRevision:r.revision,reason}),
};
