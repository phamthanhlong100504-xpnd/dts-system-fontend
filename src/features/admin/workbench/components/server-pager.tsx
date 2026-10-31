import {Button} from '@/components/ui/button';
export function ServerPager({page,size,total,busy,onChange}:{page:number;size:number;total:number;busy:boolean;onChange:(page:number)=>void}) {
 return <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]/6"><p>{total.toLocaleString('vi-VN')} nội dung theo bộ lọc</p><div className="dts-admin-actions"><Button type="button" variant="outline" disabled={busy||page===0} onClick={()=>onChange(page-1)}>Trang trước</Button><span>Trang {page+1}</span><Button type="button" variant="outline" disabled={busy||(page+1)*size>=total} onClick={()=>onChange(page+1)}>Trang sau</Button></div></div>;
}
