import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, Users, FileText, Layers, LogOut } from 'lucide-react';
import Icon from '@/components/ui/icon';
import ArticlesTab from '@/components/admin/ArticlesTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import UsersTab from '@/components/admin/UsersTab';

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
            <ArticlesTab 
              articles={articles}
              categories={categories}
              canEdit={canEdit}
              canDelete={canDelete}
              loadData={loadData}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="categories">
              <CategoriesTab 
                categories={categories}
                loadData={loadData}
              />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="users">
              <UsersTab 
                users={users}
                loadData={loadData}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
