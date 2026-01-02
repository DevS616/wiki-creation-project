import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, Plus, Pencil, Trash2, Users, FileText, Layers, LogOut, Link, Check } from 'lucide-react';
import Icon from '@/components/ui/icon';
import SimpleTextEditor from '@/components/SimpleTextEditor';

const API_URL = 'https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4';

interface User {
  id: number;
  steam_id: string;
  username: string;
  avatar_url: string;
  role: string;
}

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

const AdminPanel = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  
  const [articleContent, setArticleContent] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!token || !userStr) {
      navigate('/adm');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    } catch {
      navigate('/adm');
    }
  };

  const loadData = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const categoriesRes = await fetch(`${API_URL}?action=categories`);
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData.categories || []);

      const articlesRes = await fetch(`${API_URL}?action=articles`);
      const articlesData = await articlesRes.json();
      setArticles(articlesData.articles || []);

      const userStr = localStorage.getItem('admin_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.steam_id === '76561198995407853') {
          const usersRes = await fetch(`${API_URL}?action=users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/adm');
  };

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

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Удалить категорию? Все статьи этой категории останутся без категории.')) return;

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      await fetch(`${API_URL}?action=categories&id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Ошибка при удалении категории');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      icon: formData.get('icon')
    };

    try {
      await fetch(`${API_URL}?action=categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      setShowCategoryDialog(false);
      loadData();
    } catch (err) {
      console.error('Failed to save category:', err);
      alert('Ошибка при сохранении категории');
    }
  };

  const handleUpdateUserRole = async (userId: number, role: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      await fetch(`${API_URL}?action=users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId, role })
      });

      loadData();
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Ошибка при обновлении роли');
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      steam_id: formData.get('steam_id'),
      username: formData.get('username'),
      role: formData.get('role')
    };

    try {
      const response = await fetch(`${API_URL}?action=users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to add user');
      }

      setShowUserDialog(false);
      loadData();
    } catch (err) {
      console.error('Failed to add user:', err);
      alert('Ошибка при добавлении пользователя');
    }
  };

  if (!currentUser) {
    return null;
  }

  // Если у пользователя нет доступа - показываем блокирующее окно
  if (currentUser.role === 'no_access') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-slate-800/50 border-slate-700 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="ShieldAlert" size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Доступ запрещён</h2>
            <p className="text-slate-400 mb-4">
              У вас нет прав для доступа к админ-панели. 
              <br />
              Обратитесь к администратору для получения доступа.
            </p>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-500 mb-1">Ваш Steam ID:</p>
              <p className="text-white font-mono text-sm">{currentUser.steam_id}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              navigate('/adm');
            }}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Выйти
          </Button>
        </Card>
      </div>
    );
  }

  const canEdit = ['editor', 'moderator', 'administrator'].includes(currentUser.role);
  const canDelete = ['moderator', 'administrator'].includes(currentUser.role);
  const isAdmin = currentUser.role === 'administrator';
  const isSuperAdmin = currentUser.steam_id === '76561198995407853';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Flame size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Админ-панель</h1>
                <p className="text-sm text-slate-400">Wiki Devilrust</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {currentUser.avatar_url && (
                  <img src={currentUser.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{currentUser.username}</p>
                  <p className="text-slate-400 text-xs capitalize">{currentUser.role}</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm" className="border-slate-700">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="articles" className="data-[state=active]:bg-orange-600">
              <FileText size={16} className="mr-2" />
              Статьи
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="categories" className="data-[state=active]:bg-orange-600">
                <Layers size={16} className="mr-2" />
                Категории
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="users" className="data-[state=active]:bg-orange-600">
                <Users size={16} className="mr-2" />
                Пользователи
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="articles">
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
                          <Label className="text-white">Превью изображение</Label>
                          <Tabs defaultValue="url" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                              <TabsTrigger value="url">URL</TabsTrigger>
                              <TabsTrigger value="upload">Загрузить</TabsTrigger>
                            </TabsList>
                            <TabsContent value="url" className="space-y-2">
                              <Input
                                placeholder="https://example.com/image.jpg"
                                value={previewImage}
                                onChange={(e) => setPreviewImage(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white"
                              />
                            </TabsContent>
                            <TabsContent value="upload" className="space-y-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    const base64 = event.target?.result as string;
                                    
                                    try {
                                      const response = await fetch('https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4?action=upload_image', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                                        },
                                        body: JSON.stringify({
                                          image: base64,
                                          filename: file.name
                                        })
                                      });

                                      const data = await response.json();
                                      
                                      if (data.url) {
                                        setPreviewImage(data.url);
                                      } else {
                                        alert('Ошибка при загрузке изображения');
                                      }
                                    } catch (err) {
                                      console.error('Failed to upload image:', err);
                                      alert('Ошибка при загрузке изображения');
                                    }
                                  };
                                  
                                  reader.readAsDataURL(file);
                                }}
                                className="bg-slate-900 border-slate-700 text-white"
                              />
                              <p className="text-xs text-slate-400">Поддерживаются: JPG, PNG, GIF, WebP</p>
                            </TabsContent>
                          </Tabs>
                          {previewImage && (
                            <img src={previewImage} alt="Превью" className="mt-2 w-full max-w-sm rounded-lg" />
                          )}
                        </div>
                        <div>
                          <Label className="text-white">Содержание</Label>
                          <SimpleTextEditor
                            value={articleContent}
                            onChange={setArticleContent}
                            placeholder="Напишите содержание статьи..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                            Сохранить
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

              <div className="space-y-4">
                {articles.map(article => (
                  <Card key={article.id} className="p-4 bg-slate-900/50 border-slate-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-orange-600/20 text-orange-400 px-2 py-1 rounded">ID: {article.id}</span>
                          <h3 className="text-lg font-semibold text-white">{article.title}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{article.description}</p>
                        <div className="flex gap-2 text-xs text-slate-500">
                          <span>Категория: {article.category_name}</span>
                          {article.author_name && <span>• Автор: {article.author_name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = `${window.location.origin}/${article.id}`;
                            navigator.clipboard.writeText(url);
                            setCopiedId(article.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="border-slate-700 text-slate-400 hover:text-white"
                          title="Копировать ссылку"
                        >
                          {copiedId === article.id ? <Check size={14} className="text-green-400" /> : <Link size={14} />}
                        </Button>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditArticle(article);
                              setArticleContent(article.content);
                              setPreviewImage(article.preview_image || '');
                              setSelectedCategoryId(article.category_id?.toString() || '');
                              setShowArticleDialog(true);
                            }}
                            className="border-slate-700"
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteArticle(article.id)}
                            className="border-red-700 text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="categories">
              <Card className="p-6 bg-slate-800/50 border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Управление категориями</h2>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus size={16} className="mr-2" />
                        Добавить категорию
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Новая категория</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSaveCategory} className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-white">Название</Label>
                          <Input
                            id="name"
                            name="name"
                            required
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="icon" className="text-white">Иконка (Lucide React)</Label>
                          <Input
                            id="icon"
                            name="icon"
                            required
                            defaultValue="BookOpen"
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="BookOpen, Map, Wrench, etc."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                            Создать
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCategoryDialog(false)}
                            className="border-slate-700 text-white"
                          >
                            Отмена
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(category => (
                    <Card key={category.id} className="p-4 bg-slate-900/50 border-slate-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
                          <p className="text-slate-400 text-sm">Иконка: {category.icon}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="users">
              <Card className="p-6 bg-slate-800/50 border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Управление пользователями</h2>
                  <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus size={16} className="mr-2" />
                        Добавить пользователя
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Новый пользователь</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                          <Label htmlFor="steam_id" className="text-white">Steam ID</Label>
                          <Input
                            id="steam_id"
                            name="steam_id"
                            required
                            placeholder="76561198000000000"
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="username" className="text-white">Имя пользователя</Label>
                          <Input
                            id="username"
                            name="username"
                            required
                            placeholder="Введите имя"
                            className="bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role" className="text-white">Роль</Label>
                          <Select name="role" defaultValue="editor" required>
                            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                              <SelectItem value="editor" className="text-white">Редактор</SelectItem>
                              <SelectItem value="moderator" className="text-white">Модератор</SelectItem>
                              <SelectItem value="administrator" className="text-white">Администратор</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                            Добавить
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowUserDialog(false)}
                            className="border-slate-600 bg-slate-900/80 text-white hover:bg-slate-700 hover:border-slate-500"
                          >
                            Отмена
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {users.map(user => (
                    <Card key={user.id} className="p-4 bg-slate-900/50 border-slate-700">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {user.avatar_url && (
                            <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                          )}
                          <div>
                            <h3 className="text-white font-semibold">{user.username}</h3>
                            <p className="text-slate-400 text-sm">Steam ID: {user.steam_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.steam_id !== '76561198995407853' ? (
                            <Select
                              value={user.role}
                              onValueChange={(role) => handleUpdateUserRole(user.id, role)}
                            >
                              <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="editor" className="text-white">Редактор</SelectItem>
                                <SelectItem value="moderator" className="text-white">Модератор</SelectItem>
                                <SelectItem value="administrator" className="text-white">Администратор</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="px-3 py-2 bg-orange-600/20 text-orange-400 rounded-md text-sm font-medium">
                              Супер-админ
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;