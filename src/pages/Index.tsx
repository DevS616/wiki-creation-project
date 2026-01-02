import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, ExternalLink, Layers, Info, Search, ChevronRight, SearchX, ArrowLeft, BookOpen, Map, Wrench, Package, Sparkles } from 'lucide-react';

const API_URL = 'https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4';

interface Article {
  id: number;
  title: string;
  category_name: string;
  category_icon: string;
  description: string;
  content: string;
  preview_image?: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

const Index = () => {
  const { articleId } = useParams<{ articleId?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>(['Все']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (articleId && articles.length > 0) {
      const article = articles.find(a => a.id === parseInt(articleId));
      if (article) {
        setSelectedArticle(article);
      }
    }
  }, [articleId, articles]);

  const loadData = async () => {
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}?action=articles`),
        fetch(`${API_URL}?action=categories`)
      ]);

      const articlesData = await articlesRes.json();
      const categoriesData = await categoriesRes.json();

      setArticles(articlesData.articles || []);
      
      const categoryNames = categoriesData.categories?.map((c: Category) => c.name) || [];
      setCategories(['Все', ...categoryNames]);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Все' || article.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

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
                      onClick={() => {
                        setSelectedArticle(article);
                        navigate(`/${article.id}`);
                      }}
                      className="p-5 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-orange-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-sm px-3 py-1 font-medium">
                            {article.category_name || 'Без категории'}
                          </Badge>
                          <span className="text-xs font-mono bg-slate-700/50 text-slate-400 px-2 py-1 rounded">
                            ID: {article.id}
                          </span>
                        </div>
                        <ChevronRight 
                          size={20} 
                          className="text-slate-400 group-hover:text-orange-400 transition-colors" 
                        />
                      </div>
                      <div className="flex items-start gap-3 mb-2">
                        {article.preview_image ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={article.preview_image} 
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-orange-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-600/20 transition-colors">
                            {article.category_name === 'Основное' && <BookOpen size={22} className="text-orange-400" />}
                            {article.category_name === 'Гайды' && <Map size={22} className="text-orange-400" />}
                            {article.category_name === 'Механики' && <Wrench size={22} className="text-orange-400" />}
                            {article.category_name === 'Кастомные предметы' && <Package size={22} className="text-orange-400" />}
                            {article.category_name === 'Развлекательные ивенты' && <Sparkles size={22} className="text-orange-400" />}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white group-hover:text-orange-400 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-slate-400 text-sm line-clamp-2 mt-1">
                            {article.description}
                          </p>
                        </div>
                      </div>
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
                  onClick={() => {
                    setSelectedArticle(null);
                    navigate('/');
                  }}
                  className="mb-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Назад к списку
                </button>
                
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-sm px-3 py-1 font-medium mb-4">
                  {selectedArticle.category_name || 'Без категории'}
                </Badge>
                
                <h1 className="text-4xl font-bold text-white mb-4">
                  {selectedArticle.title}
                </h1>
                
                <p className="text-slate-400 mb-8">
                  {selectedArticle.description}
                </p>
                
                <style>{`
                  .prose ul, .prose ol {
                    margin: 16px 0;
                    padding-left: 24px;
                    list-style-position: outside;
                  }
                  .prose ul { list-style-type: disc; }
                  .prose ol { list-style-type: decimal; }
                  .prose li { margin: 4px 0; }
                  .prose hr {
                    border: none;
                    border-top: 1px solid #475569;
                    margin: 24px 0;
                  }
                  .prose h2 {
                    color: #fff;
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin: 20px 0 12px 0;
                  }
                  .prose h3 {
                    color: #fff;
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 16px 0 10px 0;
                  }
                  .prose p {
                    margin: 12px 0;
                  }
                  .prose a {
                    color: #ff6b35;
                    text-decoration: underline;
                  }
                  .prose img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 16px 0;
                  }
                `}</style>
                
                <div 
                  className="prose prose-invert max-w-none text-slate-300"
                  style={{ lineHeight: '1.8' }}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;