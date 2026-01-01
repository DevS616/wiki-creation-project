import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, ExternalLink, Layers, Info, Search, ChevronRight, SearchX, ArrowLeft, BookOpen, Map, Wrench, Package, Sparkles } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  category: string;
  description: string;
  content: string;
}

const articles: Article[] = [
  {
    id: 1,
    title: 'Правила сервера',
    category: 'Основное',
    description: 'Общие правила поведения на сервере Devilrust',
    content: 'Основные правила сервера, которые должен знать каждый игрок...'
  },
  {
    id: 2,
    title: 'Начало игры',
    category: 'Гайды',
    description: 'С чего начать новичку на сервере',
    content: 'Пошаговое руководство для новых игроков...'
  },
  {
    id: 3,
    title: 'Система рейдов',
    category: 'Механики',
    description: 'Как устроены рейды на сервере',
    content: 'Подробное описание системы рейдов...'
  },
  {
    id: 4,
    title: 'Экономика сервера',
    category: 'Механики',
    description: 'Торговля, магазины и валюта',
    content: 'Информация об экономической системе сервера...'
  },
  {
    id: 5,
    title: 'Команды администрации',
    category: 'Основное',
    description: 'Список доступных команд',
    content: 'Все команды, которые можно использовать на сервере...'
  },
  {
    id: 6,
    title: 'Крафт предметов',
    category: 'Гайды',
    description: 'Уникальные рецепты крафта',
    content: 'Особые рецепты крафта, доступные на сервере...'
  },
  {
    id: 7,
    title: 'Кастомное оружие',
    category: 'Кастомные предметы',
    description: 'Уникальное оружие с особыми характеристиками',
    content: 'На сервере доступно эксклюзивное кастомное оружие...'
  },
  {
    id: 8,
    title: 'Уникальная броня',
    category: 'Кастомные предметы',
    description: 'Специальная броня с дополнительными бонусами',
    content: 'Описание кастомной брони и способов её получения...'
  },
  {
    id: 9,
    title: 'PvP турниры',
    category: 'Развлекательные ивенты',
    description: 'Регулярные турниры с призами',
    content: 'Информация о PvP турнирах и наградах...'
  },
  {
    id: 10,
    title: 'Квесты и задания',
    category: 'Развлекательные ивенты',
    description: 'Еженедельные квесты для игроков',
    content: 'Список активных квестов и способы их выполнения...'
  },
];

const categories = ['Все', 'Основное', 'Гайды', 'Механики', 'Кастомные предметы', 'Развлекательные ивенты'];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Все' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Flame size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Wiki Devilrust</h1>
                <p className="text-sm text-slate-400">Энциклопедия проекта</p>
              </div>
            </div>
            <a 
              href="https://devilrust.ru" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-2 md:px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-1 md:gap-2 text-sm md:text-base whitespace-nowrap"
            >
              <ExternalLink size={16} className="md:hidden" />
              <span className="hidden md:inline">Сайт сервера</span>
              <span className="md:hidden">Сайт</span>
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="p-4 bg-slate-800/50 border-slate-700 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers size={20} />
                Категории
              </h2>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedArticle(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      selectedCategory === category
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Info size={16} />
                  Статистика
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Всего статей:</span>
                    <span className="font-semibold">{articles.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Категорий:</span>
                    <span className="font-semibold">{categories.length - 1}</span>
                  </div>
                </div>
              </div>
            </Card>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3">
            {!selectedArticle ? (
              <>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search 
                      size={20} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
                    />
                    <Input
                      type="text"
                      placeholder="Поиск по статьям..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Articles grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map(article => (
                    <Card
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="p-5 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-orange-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                          {article.category}
                        </Badge>
                        <ChevronRight 
                          size={20} 
                          className="text-slate-400 group-hover:text-orange-400 transition-colors" 
                        />
                      </div>
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-600/20 transition-colors">
                          {article.category === 'Основное' && <BookOpen size={20} className="text-orange-400" />}
                          {article.category === 'Гайды' && <Map size={20} className="text-orange-400" />}
                          {article.category === 'Механики' && <Wrench size={20} className="text-orange-400" />}
                          {article.category === 'Кастомные предметы' && <Package size={20} className="text-orange-400" />}
                          {article.category === 'Развлекательные ивенты' && <Sparkles size={20} className="text-orange-400" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white group-hover:text-orange-400 transition-colors">
                            {article.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm ml-13">
                        {article.description}
                      </p>
                    </Card>
                  ))}
                </div>

                {filteredArticles.length === 0 && (
                  <Card className="p-12 bg-slate-800/50 border-slate-700 text-center">
                    <SearchX size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400 text-lg">Статьи не найдены</p>
                    <p className="text-slate-500 text-sm mt-2">Попробуйте изменить параметры поиска</p>
                  </Card>
                )}
              </>
            ) : (
              /* Article view */
              <Card className="p-8 bg-slate-800/50 border-slate-700">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="mb-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Назад к списку
                </button>
                
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-600/30 mb-4">
                  {selectedArticle.category}
                </Badge>
                
                <h1 className="text-4xl font-bold text-white mb-4">
                  {selectedArticle.title}
                </h1>
                
                <p className="text-slate-400 mb-8">
                  {selectedArticle.description}
                </p>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed">
                    {selectedArticle.content}
                  </p>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;