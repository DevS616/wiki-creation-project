import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Flame, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Custom404 = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Flame size={48} className="text-white" />
          </div>
        </div>
        
        <h1 className="text-8xl font-bold text-orange-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-3">Страница не найдена</h2>
        <p className="text-slate-400 mb-8">
          Похоже, эта страница исчезла в бездне. Возможно, она никогда не существовала.
        </p>
        
        <a href="/">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <Home size={20} />
            Вернуться на главную
          </Button>
        </a>
      </div>
    </div>
  );
};

export default Custom404;
