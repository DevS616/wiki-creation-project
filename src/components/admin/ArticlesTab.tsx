import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Link, Check, ArrowLeft, Upload, X, Save } from 'lucide-react';
import Icon from '@/components/ui/icon';
import RichTextEditor from '@/components/RichTextEditor';

const API_URL = 'https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Article {
  id: number;
  title: string;
  description: string;
  content: string;
  category_id: number;
  category_name?: string;
  category_ids?: number[];
  categories?: Array<{id: number; name: string; icon: string}>;
  author_name?: string;
  preview_image?: string;
}

interface ArticlesTabProps {
  articles: Article[];
  categories: Category[];
  canEdit: boolean;
  canDelete: boolean;
  loadData: () => void;
}

const ArticlesTab = ({ articles, categories, canEdit, canDelete, loadData }: ArticlesTabProps) => {
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [articleContent, setArticleContent] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [previewImageUploading, setPreviewImageUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fixLinks = (content: string): string => {
    return content.replace(/href="([^"]+)"/g, (match, url) => {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('#')) {
        return match;
      }
      return `href="https://${url}"`;
    });
  };

  const openEditor = (article?: Article) => {
    if (article) {
      setEditArticle(article);
      setTitle(article.title);
      setDescription(article.description);
      setArticleContent(article.content);
      setPreviewImage(article.preview_image || '');
      setSelectedCategoryIds(article.category_ids?.map(id => id.toString()) || []);
    } else {
      setEditArticle(null);
      setTitle('');
      setDescription('');
      setArticleContent('');
      setPreviewImage('');
      setSelectedCategoryIds([]);
    }
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditArticle(null);
  };

  const handleSaveArticle = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token || !title.trim()) return;
    setSaving(true);
    try {
      const method = editArticle ? 'PUT' : 'POST';
      await fetch(`${API_URL}?action=articles`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: editArticle?.id,
          title: title.trim(),
          description: description.trim(),
          content: fixLinks(articleContent),
          category_ids: selectedCategoryIds.map(id => parseInt(id)),
          preview_image: previewImage || null,
        }),
      });
      closeEditor();
      loadData();
    } catch {
      alert('Ошибка при сохранении статьи');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await fetch(`${API_URL}?action=articles&id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      loadData();
    } catch {
      alert('Ошибка при удалении статьи');
    }
  };

  const copyArticleLink = (id: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewImageUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch(`${API_URL}?action=upload_image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
          body: JSON.stringify({ image: reader.result, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) setPreviewImage(data.url);
        else alert('Ошибка загрузки изображения');
      } catch {
        alert('Ошибка загрузки изображения');
      } finally {
        setPreviewImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Полноэкранный редактор
  if (isEditorOpen) {
    return (
      <div className="flex flex-col h-full">
        {/* Шапка редактора */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={closeEditor} className="text-slate-400 hover:text-white -ml-2">
              <ArrowLeft size={18} className="mr-1" />
              Назад
            </Button>
            <div className="w-px h-5 bg-slate-700" />
            <span className="text-slate-400 text-sm">{editArticle ? 'Редактирование' : 'Новая статья'}</span>
            {title && <span className="text-white text-sm font-medium truncate max-w-xs">{title}</span>}
          </div>
          <Button
            onClick={handleSaveArticle}
            disabled={saving || !title.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving
              ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Сохраняем...</>
              : <><Save size={16} className="mr-2" />{editArticle ? 'Сохранить' : 'Опубликовать'}</>
            }
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Основная область — контент */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Заголовок статьи..."
                className="w-full bg-transparent text-3xl font-bold text-white placeholder-slate-600 outline-none border-none"
              />
            </div>
            <div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Краткое описание статьи..."
                rows={2}
                className="w-full bg-transparent text-slate-400 placeholder-slate-600 outline-none border-none resize-none text-base"
              />
            </div>
            <div className="border-t border-slate-700/50 pt-4">
              <RichTextEditor value={articleContent} onChange={setArticleContent} />
            </div>
          </div>

          {/* Боковая панель */}
          <div className="w-72 flex-shrink-0 space-y-5">

            {/* Превью изображение */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Превью</p>
              {previewImage ? (
                <div className="relative group">
                  <img src={previewImage} alt="" className="w-full aspect-video object-cover rounded-lg border border-slate-700" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs border-slate-500" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={12} className="mr-1" />Заменить
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-slate-500 text-red-400" onClick={() => setPreviewImage('')}>
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={previewImageUploading}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-700 hover:border-orange-600/50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-400"
                >
                  {previewImageUploading
                    ? <><Icon name="Loader2" size={20} className="animate-spin" /><span className="text-xs">Загрузка...</span></>
                    : <><Upload size={20} /><span className="text-xs">Загрузить изображение</span></>
                  }
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePreviewUpload} />
              <div className="mt-2">
                <Input
                  value={previewImage}
                  onChange={e => setPreviewImage(e.target.value)}
                  placeholder="или вставь URL..."
                  className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                />
              </div>
            </div>

            {/* Категории */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Категории</p>
              <div className="space-y-1">
                {categories.map(cat => {
                  const selected = selectedCategoryIds.includes(cat.id.toString());
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id.toString())}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                        selected
                          ? 'bg-orange-600/20 text-orange-400 border border-orange-600/40'
                          : 'text-slate-400 hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <Icon name={cat.icon} size={15} fallback="Layers" className="flex-shrink-0" />
                      <span>{cat.name}</span>
                      {selected && <Icon name="Check" size={14} className="ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ID статьи при редактировании */}
            {editArticle && (
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Информация</p>
                <p className="text-slate-500 text-xs">ID: <span className="text-slate-300">{editArticle.id}</span></p>
                {editArticle.author_name && (
                  <p className="text-slate-500 text-xs mt-1">Автор: <span className="text-slate-300">{editArticle.author_name}</span></p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full h-7 text-xs border-slate-700 text-slate-400"
                  onClick={() => copyArticleLink(editArticle.id)}
                >
                  {copiedId === editArticle.id
                    ? <><Check size={12} className="mr-1 text-green-400" />Скопировано</>
                    : <><Link size={12} className="mr-1" />Скопировать ссылку</>
                  }
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Список статей
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Статьи</h2>
          <p className="text-slate-400 text-sm mt-1">{articles.length} статей</p>
        </div>
        {canEdit && (
          <Button onClick={() => openEditor()} className="bg-orange-600 hover:bg-orange-700">
            <Plus size={16} className="mr-2" />
            Новая статья
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {articles.map(article => (
          <div
            key={article.id}
            className="flex items-center gap-4 p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl transition-colors group"
          >
            {/* Превью */}
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-700">
              {article.preview_image
                ? <img src={article.preview_image} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Icon name="FileText" size={20} />
                  </div>
              }
            </div>

            {/* Инфо */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-medium truncate">{article.title}</h3>
                <span className="text-slate-600 text-xs">#{article.id}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {article.categories?.map(cat => (
                  <span key={cat.id} className="text-xs text-orange-400/80 flex items-center gap-1">
                    <Icon name={cat.icon} size={12} fallback="Layers" />
                    {cat.name}
                  </span>
                ))}
                {article.author_name && (
                  <span className="text-xs text-slate-500">· {article.author_name}</span>
                )}
              </div>
            </div>

            {/* Действия */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => copyArticleLink(article.id)} className="text-slate-400 hover:text-white h-8 w-8 p-0">
                {copiedId === article.id ? <Check size={15} className="text-green-400" /> : <Link size={15} />}
              </Button>
              {canEdit && (
                <Button variant="ghost" size="sm" onClick={() => openEditor(article)} className="text-slate-400 hover:text-white h-8 w-8 p-0">
                  <Pencil size={15} />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="sm" onClick={() => handleDeleteArticle(article.id)} className="text-slate-400 hover:text-red-400 h-8 w-8 p-0">
                  <Trash2 size={15} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlesTab;