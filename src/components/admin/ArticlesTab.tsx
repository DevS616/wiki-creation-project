import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Link, Check } from 'lucide-react';
import SimpleTextEditor from '@/components/SimpleTextEditor';

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
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [articleContent, setArticleContent] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const fixLinks = (content: string): string => {
    return content.replace(/href="([^"]+)"/g, (match, url) => {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('#')) {
        return match;
      }
      return `href="https://${url}"`;
    });
  };

  const handleSaveArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const formData = new FormData(e.currentTarget);
    const fixedContent = fixLinks(articleContent);
    const data = {
      id: editArticle?.id,
      title: formData.get('title'),
      description: formData.get('description'),
      content: fixedContent,
      category_id: parseInt(selectedCategoryId),
      preview_image: previewImage || null
    };

    try {
      const method = editArticle ? 'PUT' : 'POST';
      await fetch(`${API_URL}?action=articles`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      setShowArticleDialog(false);
      setEditArticle(null);
      setArticleContent('');
      setPreviewImage('');
      setSelectedCategoryId('');
      loadData();
    } catch (err) {
      console.error('Failed to save article:', err);
      alert('Ошибка при сохранении статьи');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Удалить статью?')) return;

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      await fetch(`${API_URL}?action=articles&id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      console.error('Failed to delete article:', err);
      alert('Ошибка при удалении статьи');
    }
  };

  const copyArticleLink = (id: number) => {
    const url = `${window.location.origin}/wiki/article/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Управление статьями</h2>
        {canEdit && (
          <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditArticle(null);
                setArticleContent('');
                setPreviewImage('');
                setSelectedCategoryId('');
              }} className="bg-orange-600 hover:bg-orange-700">
                <Plus size={16} className="mr-2" />
                Добавить статью
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editArticle ? 'Редактировать статью' : 'Новая статья'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveArticle} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Заголовок</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    defaultValue={editArticle?.title}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="category_id" className="text-white">Категория</Label>
                  <Select 
                    value={selectedCategoryId} 
                    onValueChange={setSelectedCategoryId}
                    required
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()} className="text-white">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description" className="text-white">Описание</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    defaultValue={editArticle?.description}
                    className="bg-slate-900 border-slate-700 text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="preview_image" className="text-white">Превью (URL)</Label>
                  <Input
                    id="preview_image"
                    name="preview_image"
                    value={previewImage}
                    onChange={(e) => setPreviewImage(e.target.value)}
                    placeholder="https://..."
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Контент</Label>
                  <SimpleTextEditor
                    value={articleContent}
                    onChange={setArticleContent}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    {editArticle ? 'Сохранить' : 'Создать'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowArticleDialog(false);
                      setEditArticle(null);
                      setArticleContent('');
                      setPreviewImage('');
                      setSelectedCategoryId('');
                    }}
                    className="border-slate-600 bg-slate-900/80 text-white hover:bg-slate-700 hover:border-slate-500"
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {articles.map(article => (
          <Card key={article.id} className="p-4 bg-slate-900/50 border-slate-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{article.title}</h3>
                  {article.category_name && (
                    <span className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded text-xs">
                      {article.category_name}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-2">{article.description}</p>
                {article.author_name && (
                  <p className="text-slate-500 text-xs">Автор: {article.author_name}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyArticleLink(article.id)}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedId === article.id ? <Check size={18} /> : <Link size={18} />}
                </Button>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditArticle(article);
                      setArticleContent(article.content);
                      setPreviewImage(article.preview_image || '');
                      setSelectedCategoryId(article.category_id.toString());
                      setShowArticleDialog(true);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <Pencil size={18} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteArticle(article.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default ArticlesTab;
