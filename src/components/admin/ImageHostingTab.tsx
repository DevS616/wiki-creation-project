import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4';

interface HostedImage {
  key: string;
  url: string;
  size: number;
  last_modified: string;
}

interface Props {
  token: string;
}

export default function ImageHostingTab({ token }: Props) {
  const [images, setImages] = useState<HostedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=hosting_images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setImages(data.images || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch(`${API_URL}?action=hosting_images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) {
          setImages(prev => [{
            key: data.key,
            url: data.url,
            size: file.size,
            last_modified: new Date().toISOString(),
          }, ...prev]);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleCopy = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Удалить изображение?')) return;
    setDeletingKey(key);
    try {
      await fetch(`${API_URL}?action=hosting_images`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      setImages(prev => prev.filter(img => img.key !== key));
    } finally {
      setDeletingKey(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Хостинг картинок</h2>
        <div className="flex gap-2">
          <Button onClick={() => load()} variant="outline" size="sm" disabled={loading}>
            <Icon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="sm">
            {uploading ? (
              <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Загрузка...</>
            ) : (
              <><Icon name="Upload" size={14} className="mr-2" />Загрузить</>
            )}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-2" />
          Загрузка...
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <Icon name="Image" size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Нет загруженных картинок</p>
          <p className="text-sm mt-1">Нажми «Загрузить» чтобы добавить первое изображение</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map(img => (
            <Card key={img.key} className="overflow-hidden group relative">
              <div className="aspect-square bg-muted">
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs text-muted-foreground truncate" title={img.key.split('/').pop()}>
                  {img.key.split('/').pop()}
                </p>
                <p className="text-xs text-muted-foreground">{formatSize(img.size)}</p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => handleCopy(img.url, img.key)}
                  >
                    {copiedKey === img.key ? (
                      <><Icon name="Check" size={12} className="mr-1 text-green-500" />Скопировано</>
                    ) : (
                      <><Icon name="Copy" size={12} className="mr-1" />Копировать</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(img.key)}
                    disabled={deletingKey === img.key}
                  >
                    {deletingKey === img.key
                      ? <Icon name="Loader2" size={12} className="animate-spin" />
                      : <Icon name="Trash2" size={12} />
                    }
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
