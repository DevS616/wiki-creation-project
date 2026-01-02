import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { 
  Bold, Italic, Link, Image as ImageIcon, List, ListOrdered, 
  Minus, Palette, Code, Quote, Heading2, Heading3, 
  AlignLeft, AlignCenter, AlignRight, Table, Eye, EyeOff,
  Underline, Strikethrough, HighlighterIcon, Type
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [textColor, setTextColor] = useState('#ff6b35');
  const [bgColor, setBgColor] = useState('#fef3c7');
  const [showPreview, setShowPreview] = useState(false);

  const insertTag = (openTag: string, closeTag: string, placeholder?: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const insertText = selectedText || placeholder || '';
    const newText = value.substring(0, start) + openTag + insertText + closeTag + value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      if (!selectedText && placeholder) {
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + insertText.length);
      } else {
        textarea.setSelectionRange(start + openTag.length, end + openTag.length);
      }
    }, 0);
  };

  const insertColoredText = () => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (!selectedText) {
      alert('Выделите текст для изменения цвета');
      return;
    }

    const coloredHtml = `<span style="color: ${textColor};">${selectedText}</span>`;
    const newText = value.substring(0, start) + coloredHtml + value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const insertHighlight = () => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (!selectedText) {
      alert('Выделите текст для выделения фона');
      return;
    }

    const highlightedHtml = `<mark style="background-color: ${bgColor}; padding: 2px 4px; border-radius: 3px;">${selectedText}</mark>`;
    const newText = value.substring(0, start) + highlightedHtml + value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const insertLink = () => {
    if (!linkUrl) return;
    const formattedUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') 
      ? linkUrl 
      : `https://${linkUrl}`;
    const linkHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline;">${linkText || linkUrl}</a>`;
    onChange(value + linkHtml);
    setLinkUrl('');
    setLinkText('');
  };

  const insertImage = () => {
    if (!imageUrl) return;
    const imgHtml = `<img src="${imageUrl}" alt="${imageAlt || 'Изображение'}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />`;
    onChange(value + imgHtml);
    setImageUrl('');
    setImageAlt('');
  };

  const insertList = (ordered: boolean) => {
    const listTag = ordered ? 'ol' : 'ul';
    const listHtml = `<${listTag} style="margin: 16px 0; padding-left: 24px;">
  <li>Пункт 1</li>
  <li>Пункт 2</li>
  <li>Пункт 3</li>
</${listTag}>`;
    onChange(value + listHtml);
  };

  const insertDivider = () => {
    const dividerHtml = `<hr style="border: none; border-top: 1px solid #475569; margin: 24px 0;" />`;
    onChange(value + dividerHtml);
  };

  const insertCodeBlock = () => {
    const codeHtml = `<pre style="background-color: #1e293b; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0;"><code style="color: #e2e8f0; font-family: monospace;">// Ваш код здесь</code></pre>`;
    onChange(value + codeHtml);
  };

  const insertBlockquote = () => {
    const quoteHtml = `<blockquote style="border-left: 4px solid #ff6b35; padding-left: 16px; margin: 16px 0; color: #94a3b8; font-style: italic;">Цитата или важная информация</blockquote>`;
    onChange(value + quoteHtml);
  };

  const insertTable = () => {
    const tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background-color: #334155;">
      <th style="border: 1px solid #475569; padding: 12px; color: #fff;">Заголовок 1</th>
      <th style="border: 1px solid #475569; padding: 12px; color: #fff;">Заголовок 2</th>
      <th style="border: 1px solid #475569; padding: 12px; color: #fff;">Заголовок 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #475569; padding: 12px;">Ячейка 1</td>
      <td style="border: 1px solid #475569; padding: 12px;">Ячейка 2</td>
      <td style="border: 1px solid #475569; padding: 12px;">Ячейка 3</td>
    </tr>
    <tr>
      <td style="border: 1px solid #475569; padding: 12px;">Ячейка 4</td>
      <td style="border: 1px solid #475569; padding: 12px;">Ячейка 5</td>
      <td style="border: 1px solid #475569; padding: 12px;">Ячейка 6</td>
    </tr>
  </tbody>
</table>`;
    onChange(value + tableHtml);
  };

  const applyAlignment = (align: 'left' | 'center' | 'right') => {
    insertTag(`<div style="text-align: ${align};">`, '</div>', 'Текст с выравниванием');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          const imgHtml = `<img src="${data.url}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />`;
          onChange(value + imgHtml);
        } else {
          alert('Ошибка при загрузке изображения');
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
        alert('Ошибка при загрузке изображения');
      }
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-slate-900/50 border-slate-700">
        <div className="space-y-3">
          {/* Форматирование текста */}
          <div className="space-y-2">
            <Label className="text-white text-xs font-semibold">Форматирование</Label>
            <div className="flex gap-1 flex-wrap">
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<strong>', '</strong>')} className="border-slate-700 hover:bg-slate-700" title="Жирный текст">
                <Bold size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<em>', '</em>')} className="border-slate-700 hover:bg-slate-700" title="Курсив">
                <Italic size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<u>', '</u>')} className="border-slate-700 hover:bg-slate-700" title="Подчеркивание">
                <Underline size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<s>', '</s>')} className="border-slate-700 hover:bg-slate-700" title="Зачеркнутый">
                <Strikethrough size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<code style="background-color: #1e293b; padding: 2px 6px; border-radius: 4px; color: #e2e8f0; font-family: monospace;">', '</code>')} className="border-slate-700 hover:bg-slate-700" title="Инлайн код">
                <Code size={16} />
              </Button>
            </div>
          </div>

          {/* Заголовки и структура */}
          <div className="space-y-2">
            <Label className="text-white text-xs font-semibold">Структура</Label>
            <div className="flex gap-1 flex-wrap">
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<h2 style="color: #fff; font-size: 1.875rem; font-weight: 700; margin: 20px 0 12px 0;">', '</h2>', 'Заголовок 2')} className="border-slate-700 hover:bg-slate-700" title="Заголовок 2">
                <Heading2 size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<h3 style="color: #fff; font-size: 1.5rem; font-weight: 600; margin: 16px 0 10px 0;">', '</h3>', 'Заголовок 3')} className="border-slate-700 hover:bg-slate-700" title="Заголовок 3">
                <Heading3 size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<p style="margin: 12px 0; line-height: 1.6;">', '</p>', 'Параграф')} className="border-slate-700 hover:bg-slate-700" title="Параграф">
                <Type size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<br/>', '')} className="border-slate-700 hover:bg-slate-700" title="Перенос строки">BR</Button>
              <Button type="button" size="sm" variant="outline" onClick={insertBlockquote} className="border-slate-700 hover:bg-slate-700" title="Цитата">
                <Quote size={16} />
              </Button>
            </div>
          </div>

          {/* Списки и элементы */}
          <div className="space-y-2">
            <Label className="text-white text-xs font-semibold">Элементы</Label>
            <div className="flex gap-1 flex-wrap">
              <Button type="button" size="sm" variant="outline" onClick={() => insertList(false)} className="border-slate-700 hover:bg-slate-700" title="Маркированный список">
                <List size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => insertList(true)} className="border-slate-700 hover:bg-slate-700" title="Нумерованный список">
                <ListOrdered size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={insertDivider} className="border-slate-700 hover:bg-slate-700" title="Разделитель">
                <Minus size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={insertCodeBlock} className="border-slate-700 hover:bg-slate-700" title="Блок кода">
                <Code size={16} className="mr-1" /> Block
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={insertTable} className="border-slate-700 hover:bg-slate-700" title="Таблица">
                <Table size={16} />
              </Button>
            </div>
          </div>

          {/* Выравнивание */}
          <div className="space-y-2">
            <Label className="text-white text-xs font-semibold">Выравнивание</Label>
            <div className="flex gap-1 flex-wrap">
              <Button type="button" size="sm" variant="outline" onClick={() => applyAlignment('left')} className="border-slate-700 hover:bg-slate-700" title="По левому краю">
                <AlignLeft size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyAlignment('center')} className="border-slate-700 hover:bg-slate-700" title="По центру">
                <AlignCenter size={16} />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyAlignment('right')} className="border-slate-700 hover:bg-slate-700" title="По правому краю">
                <AlignRight size={16} />
              </Button>
            </div>
          </div>

          {/* Цвета */}
          <div className="space-y-2">
            <Label className="text-white text-xs font-semibold">Цвета и выделение</Label>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-2">
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 rounded border border-slate-700 cursor-pointer" title="Выбрать цвет текста" />
                <Button type="button" size="sm" variant="outline" onClick={insertColoredText} className="border-slate-700 hover:bg-slate-700" title="Применить цвет к выделенному тексту">
                  <Palette size={16} className="mr-1" /> Текст
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded border border-slate-700 cursor-pointer" title="Выбрать цвет фона" />
                <Button type="button" size="sm" variant="outline" onClick={insertHighlight} className="border-slate-700 hover:bg-slate-700" title="Выделить текст фоном">
                  <HighlighterIcon size={16} className="mr-1" /> Фон
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Переключатель режима просмотра */}
      <div className="flex items-center justify-between">
        <Label className="text-white font-semibold">Содержание статьи</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)} className="border-slate-700">
          {showPreview ? <><EyeOff size={16} className="mr-2" />Редактор</> : <><Eye size={16} className="mr-2" />Превью</>}
        </Button>
      </div>

      {/* Редактор или превью */}
      {showPreview ? (
        <Card className="p-6 bg-slate-900/50 border-slate-700 min-h-[400px] prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-500">Содержание пока пусто</p>' }} />
        </Card>
      ) : (
        <Textarea 
          id="editor-textarea" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder || "Введите HTML-код статьи..."} 
          className="bg-slate-900 border-slate-700 text-white font-mono min-h-[400px] text-sm" 
        />
      )}

      {/* Инструменты вставки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-slate-900/50 border-slate-700 space-y-3">
          <Label className="text-white flex items-center gap-2 font-semibold">
            <Link size={16} />Вставить ссылку
          </Label>
          <Input 
            placeholder="URL ссылки (например: google.com)" 
            value={linkUrl} 
            onChange={(e) => setLinkUrl(e.target.value)} 
            className="bg-slate-800 border-slate-700 text-white" 
          />
          <Input 
            placeholder="Текст ссылки (необязательно)" 
            value={linkText} 
            onChange={(e) => setLinkText(e.target.value)} 
            className="bg-slate-800 border-slate-700 text-white" 
          />
          <Button 
            type="button" 
            size="sm" 
            onClick={insertLink} 
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={!linkUrl}
          >
            Добавить ссылку
          </Button>
        </Card>

        <Card className="p-4 bg-slate-900/50 border-slate-700 space-y-3">
          <Label className="text-white flex items-center gap-2 font-semibold">
            <ImageIcon size={16} />Вставить изображение
          </Label>
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="url">По URL</TabsTrigger>
              <TabsTrigger value="upload">Загрузить</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="space-y-2">
              <Input 
                placeholder="URL изображения" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                className="bg-slate-800 border-slate-700 text-white" 
              />
              <Input 
                placeholder="Описание (alt текст)" 
                value={imageAlt} 
                onChange={(e) => setImageAlt(e.target.value)} 
                className="bg-slate-800 border-slate-700 text-white" 
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={insertImage} 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={!imageUrl}
              >
                Добавить изображение
              </Button>
            </TabsContent>
            <TabsContent value="upload" className="space-y-2">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="bg-slate-800 border-slate-700 text-white file:bg-slate-700 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3" 
              />
              <p className="text-xs text-slate-400">Форматы: JPG, PNG, GIF, WebP. Макс. размер: 5 МБ</p>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default RichTextEditor;
