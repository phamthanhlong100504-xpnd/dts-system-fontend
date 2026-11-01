'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import type {LifecycleSubject} from '../lifecycle-model';
import {LifecyclePanel} from './lifecycle-panel';
export function LifecycleButton({subject}:{subject:LifecycleSubject}) {
 const [open,setOpen]=useState(false);
 return <><Button type="button" variant="outline" size="sm" onClick={()=>setOpen(true)}>Phiên bản & Lịch sử</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>Phiên bản và lịch sử nội dung</DialogTitle><DialogDescription>Tra cứu phê duyệt, thay đổi và nơi sử dụng theo quyền được cấp.</DialogDescription></DialogHeader><LifecyclePanel subject={subject}/></DialogContent></Dialog></>;
}
