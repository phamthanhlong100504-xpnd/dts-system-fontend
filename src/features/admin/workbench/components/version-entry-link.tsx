import Link from 'next/link';
import { Button } from '@/components/ui/button';
export function VersionEntryLink({href,label}:{href:string;label:string}) {
 return <div className="mb-4 flex flex-wrap justify-end gap-3"><Button asChild variant="outline"><Link href={href}>{label}</Link></Button></div>;
}
