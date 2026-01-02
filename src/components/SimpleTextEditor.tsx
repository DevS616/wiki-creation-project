import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bold, Italic, Link, Image as ImageIcon, List, ListOrdered, Minus, Palette } from 'lucide-react';

interface SimpleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SimpleTextEditor = ({ value, onChange, placeholder }: SimpleTextEditorProps) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [textColor, setTextColor] = useState('#ff6b35');

  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, end + openTag.length);
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

  const insertLink = () => {
    if (!linkUrl) return;
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #ff6b35; text-decoration: underline;">${linkText || linkUrl}</a>`;
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
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<strong>', '</strong>')} className="border-slate-700" title="Жирный текст">
          <Bold size={16} />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<em>', '</em>')} className="border-slate-700" title="Курсив">
          <Italic size={16} />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<h2 style="color: #fff; font-size: 1.875rem; font-weight: 700; margin: 20px 0 12px 0;">', '</h2>')} className="border-slate-700" title="Заголовок 2">H2</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<h3 style="color: #fff; font-size: 1.5rem; font-weight: 600; margin: 16px 0 10px 0;">', '</h3>')} className="border-slate-700" title="Заголовок 3">H3</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<p style="margin: 12px 0;">', '</p>')} className="border-slate-700" title="Параграф">P</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertTag('<br/>', '')} className="border-slate-700" title="Перенос строки">BR</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertList(false)} className="border-slate-700" title="Маркированный список">
          <List size={16} />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertList(true)} className="border-slate-700" title="Нумерованный список">
          <ListOrdered size={16} />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={insertDivider} className="border-slate-700" title="Разделитель">
          <Minus size={16} />
        </Button>
      </div>

      <Textarea id="editor-textarea" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-slate-900 border-slate-700 text-white font-mono min-h-[300px]" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2"><Link size={16} />Добавить ссылку</Label>
          <Input placeholder="URL ссылки" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
          <Input placeholder="Текст ссылки (необязательно)" value={linkText} onChange={(e) => setLinkText(e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
          <Button type="button" size="sm" onClick={insertLink} className="w-full bg-orange-600 hover:bg-orange-700">Вставить ссылку</Button>
        </div>

        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2"><ImageIcon size={16} />Добавить изображение</Label>
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="upload">Загрузить</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="space-y-2">
              <Input placeholder="URL изображения" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
              <Input placeholder="Описание (необязательно)" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
              <Button type="button" size="sm" onClick={insertImage} className="w-full bg-orange-600 hover:bg-orange-700">Вставить изображение</Button>
            </TabsContent>
            <TabsContent value="upload" className="space-y-2">
              <Input type="file" accept="image/*" onChange={handleFileUpload} className="bg-slate-900 border-slate-700 text-white" />
              <p className="text-xs text-slate-400">Поддерживаются: JPG, PNG, GIF, WebP</p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2"><Palette size={16} />Цвет текста</Label>
          <div className="flex gap-2">
            <Input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-16 h-10 bg-slate-900 border-slate-700 cursor-pointer" />
            <Input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} placeholder="#ff6b35" className="flex-1 bg-slate-900 border-slate-700 text-white" />
          </div>
          <p className="text-xs text-slate-400">Выделите текст и нажмите кнопку</p>
          <Button type="button" size="sm" onClick={insertColoredText} className="w-full bg-orange-600 hover:bg-orange-700">Применить цвет</Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTextEditor;
