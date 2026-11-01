import type {ContentTreeNode} from '../model';
export function ContentTreePreview({nodes,depth=0}:{nodes:ContentTreeNode[];depth?:number}) {
 if(depth>=32)return <p className="text-[14px]/6 text-muted-foreground">Cây nội dung còn nhiều cấp; cần mở bản chi tiết được hệ thống cung cấp.</p>;
 return <ol className="space-y-3">{nodes.map((n,i)=><li key={`${n.id}:${i}`} className="space-y-3 rounded-xl border bg-card p-4"><p className="text-[15px]/6 font-medium">{n.title}</p><p className="text-[14px]/6 text-muted-foreground">{n.typeLabel} · {n.versionLabel} · {n.statusLabel}</p>{n.warning&&<p className="text-[14px]/6 text-amber-800 dark:text-amber-300">{n.warning}</p>}{n.children.length>0&&<div className="ml-2 border-l pl-3"><ContentTreePreview nodes={n.children} depth={depth+1}/></div>}</li>)}</ol>;
}
