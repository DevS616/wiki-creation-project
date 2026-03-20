import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4';
const MAX_SIZE_MB = 10;

interface HostedImage {
  key: string;
  url: string;
  filename: string;
  size: number;
  uploaded_at: string;
}

interface Props {
  token: string;
  isSuperAdmin: boolean;
}

export default function ImageHostingTab({ token, isSuperAdmin }: Props) {
  const [images, setImages] = useState<HostedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}?action=hosting_images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setImages(data.images || []);
    } catch {
      setError('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Файл слишком большой. Максимум ${MAX_SIZE_MB} МБ`);
      e.target.value = '';
      return;
    }

    setError(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch(`${API_URL}?action=hosting_images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result, filename: file.name }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else if (data.url) {
          setImages(prev => [{
            key: data.key,
            url: data.url,
            filename: file.name,
            size: file.size,
            uploaded_at: new Date().toISOString(),
          }, ...prev]);
        }
      } catch {
        setError('Ошибка загрузки файла');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopy = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Удалить изображение? Это действие необратимо.')) return;
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

  const handleImport = async () => {
    if (!confirm('Импортировать все существующие картинки статей в хостинг? Это может занять несколько минут.')) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch(`${API_URL}?action=hosting_images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ import_existing: true }),
      });
      const data = await res.json();
      if (data.error) setImportResult(`Ошибка: ${data.error}`);
      else setImportResult(`Импортировано: ${data.imported}, ошибок: ${data.failed}`);
      await load();
    } catch {
      setImportResult('Ошибка соединения');
    } finally {
      setImporting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold text-white">Хостинг картинок</h2>
          <p className="text-sm text-slate-400">{images.length} файлов · макс. {MAX_SIZE_MB} МБ на файл</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isSuperAdmin && (
            <Button
              onClick={handleImport}
              disabled={importing}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              {importing
                ? <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Импорт...</>
                : <><Icon name="Download" size={14} className="mr-2" />Импорт из wiki</>
              }
            </Button>
          )}
          <Button onClick={() => load()} variant="outline" size="sm" disabled={loading} className="border-slate-700">
            <Icon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="sm" className="bg-orange-600 hover:bg-orange-700">
            {uploading
              ? <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Загрузка...</>
              : <><Icon name="Upload" size={14} className="mr-2" />Загрузить</>
            }
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {importResult && (
        <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-300">
          {importResult}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2 text-sm text-red-400 flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-2" />
          Загрузка...
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
          <Icon name="Image" size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Нет загруженных картинок</p>
          <p className="text-sm mt-1">Нажми «Загрузить» чтобы добавить изображение</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map(img => (
            <Card key={img.key} className="overflow-hidden bg-slate-800/50 border-slate-700">
              <div className="aspect-square bg-slate-900">
                <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs text-slate-400 truncate" title={img.filename}>{img.filename}</p>
                <p className="text-xs text-slate-500">{formatSize(img.size)}</p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs border-slate-600"
                    onClick={() => handleCopy(img.url, img.key)}
                  >
                    {copiedKey === img.key
                      ? <><Icon name="Check" size={12} className="mr-1 text-green-400" />Скопировано</>
                      : <><Icon name="Copy" size={12} className="mr-1" />Копировать</>
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 border-slate-600 text-red-400 hover:bg-red-900/30 hover:border-red-700"
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
