import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Flame } from 'lucide-react';

const STEAM_AUTH_URL = 'https://functions.poehali.dev/124c9f33-fc31-48d7-ad2c-db1f7cc1e152';

const AdminLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Проверяем, вернулись ли мы с Steam
    const openidParams = Object.fromEntries(searchParams.entries());
    
    if (openidParams['openid.claimed_id']) {
      handleSteamCallback(openidParams);
    }
  }, [searchParams]);

  const handleSteamCallback = async (params: Record<string, string>) => {
    setLoading(true);
    setError('');

    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${STEAM_AUTH_URL}?${queryString}`);
      const data = await response.json();

      if (data.session_token && data.user) {
        // Сохраняем токен и данные пользователя
        const token = `${data.user.steam_id}:${data.user.id}`;
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));

        // Перенаправляем в админ-панель
        navigate('/admin');
      } else {
        setError('Не удалось авторизоваться через Steam');
      }
    } catch (err) {
      setError('Ошибка при авторизации');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSteamLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const returnUrl = `${window.location.origin}/adm`;
      const response = await fetch(`${STEAM_AUTH_URL}?return_url=${encodeURIComponent(returnUrl)}`);
      const data = await response.json();

      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setError('Не удалось получить ссылку для авторизации');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800/50 border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
            <Flame size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Админ-панель</h1>
          <p className="text-slate-400 text-center">Wiki Devilrust</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSteamLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Загрузка...</span>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              Войти через Steam
            </>
          )}
        </button>

        <p className="mt-4 text-slate-500 text-sm text-center">
          Войдите через Steam для доступа к админ-панели
        </p>
      </Card>
    </div>
  );
};

export default AdminLogin;
