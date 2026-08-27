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
      // KIỂM TRA: Nếu đây là một presigned URL của MinIO đã hết hạn (có chứa UUID)
      // thì cố gắng bóc tách UUID (mediaId) ra để lấy URL mới nhất
      const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
      const match = src.match(uuidRegex);
      if (match && src.includes("X-Amz-Signature")) {
        // Đây là presigned URL, bỏ qua URL cũ và đi fetch URL mới bằng mediaId vừa tìm được
        fetchMediaUrl(match[1]);
        return;
      }
      
      setUrl(src);
      return;
    }

    // Nếu src là UUID (mediaId)
    fetchMediaUrl(src);
  }, [src]);

  const fetchMediaUrl = async (mediaId: string) => {
    try {
      setLoading(true);
      const res = await mediaApi.get<any>(`${mediaId}`);
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

  if (!src) return null;

  if (loading) {
    return <div className={`flex items-center justify-center bg-muted/20 ${className || ""}`}><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>;
  }

  if (error || !url) {
    return <div className={`flex items-center justify-center bg-muted/20 text-muted-foreground text-xs ${className || ""}`}>[Lỗi tải hình ảnh]</div>;
  }

  return <img src={url} alt={alt} className={className} />;
}