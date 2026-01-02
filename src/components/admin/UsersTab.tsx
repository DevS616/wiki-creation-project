import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const API_URL = 'https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4';

interface User {
  id: number;
  steam_id: string;
  username: string;
  avatar_url: string;
  role: string;
}

interface UsersTabProps {
  users: User[];
  loadData: () => void;
}

const UsersTab = ({ users, loadData }: UsersTabProps) => {
  const [showUserDialog, setShowUserDialog] = useState(false);

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

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      await fetch(`${API_URL}?action=users&id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      loadData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Ошибка при удалении пользователя');
    }
  };

  return (
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
                    <SelectItem value="no_access" className="text-white">Без доступа</SelectItem>
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
                  <>
                    <Select
                      value={user.role}
                      onValueChange={(role) => handleUpdateUserRole(user.id, role)}
                    >
                      <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="no_access" className="text-white">Без доступа</SelectItem>
                        <SelectItem value="editor" className="text-white">Редактор</SelectItem>
                        <SelectItem value="moderator" className="text-white">Модератор</SelectItem>
                        <SelectItem value="administrator" className="text-white">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </>
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
  );
};

export default UsersTab;
