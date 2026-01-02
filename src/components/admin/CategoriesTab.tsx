import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

const API_URL = 'https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface CategoriesTabProps {
  categories: Category[];
  loadData: () => void;
}

const CategoriesTab = ({ categories, loadData }: CategoriesTabProps) => {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

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

  return (
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
                <Label htmlFor="icon" className="text-white">Иконка (Lucide)</Label>
                <Input
                  id="icon"
                  name="icon"
                  placeholder="BookOpen"
                  defaultValue="BookOpen"
                  className="bg-slate-900 border-slate-700 text-white"
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
                  className="border-slate-600 bg-slate-900/80 text-white hover:bg-slate-700 hover:border-slate-500"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories.map(category => (
          <Card key={category.id} className="p-4 bg-slate-900/50 border-slate-700">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold">{category.name}</h3>
                <p className="text-slate-400 text-sm">Иконка: {category.icon}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default CategoriesTab;
