import { useEffect, useState } from "react";
import { mediaApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function MediaImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    
    // Nếu src là URL hợp lệ (bắt đầu bằng http)
    if (src.startsWith("http")) {
      setUrl(src);
      return;
    }

    // Nếu src là UUID (mediaId)
    const fetchUrl = async () => {
      try {
        setLoading(true);
        const res = await mediaApi.get<any>(`/${src}`);
        if (res && res.url) {
          setUrl(res.url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to load media URL", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [src]);

  if (!src) return null;

  if (loading) {
    return <div className={`flex items-center justify-center bg-muted/20 ${className || ""}`}><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>;
  }

  if (error || !url) {
    return <div className={`flex items-center justify-center bg-muted/20 text-muted-foreground text-xs ${className || ""}`}>[Lỗi tải hình ảnh]</div>;
  }

  return <img src={url} alt={alt} className={className} />;
}