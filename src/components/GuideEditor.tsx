import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/4db8632d-53f9-40bd-ba69-61a3669656a4';

interface GuideEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// ─── Типы блоков ────────────────────────────────────────────────
type BlockType =
  | 'paragraph'
  | 'heading2'
  | 'heading3'
  | 'step'
  | 'warning'
  | 'tip'
  | 'image'
  | 'divider'
  | 'list'
  | 'button_link'
  | 'sub_steps';

interface Block {
  id: string;
  type: BlockType;
  // paragraph / heading / step / warning / tip / list
  text?: string;
  // step
  stepNum?: number;
  // image
  src?: string;
  caption?: string;
  uploading?: boolean;
  // list
  items?: string[];
  ordered?: boolean;
  // button_link
  label?: string;
  href?: string;
  // heading section title
  icon?: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Парсер HTML → блоки ────────────────────────────────────────

// Декодирует HTML-entities обратно в текст
function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
}

// Конвертирует GB-HTML (созданный renderBlocksToHtml) обратно в блоки
function gbHtmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];

  // Убираем <style>...</style> и обёртку <div class="gb">
  const body = html
    .replace(/<style>[\s\S]*?<\/style>/gi, '')
    .replace(/<div\s+class="gb">/gi, '')
    .replace(/<\/div>\s*$/gi, '')
    .trim();

  // Разбиваем на логические куски по тегам верхнего уровня
  const tagRe = /<(div|p|img|hr|ul|ol|a)\b([^>]*)>([\s\S]*?)<\/\1>|<(img|hr)\b([^>]*)\/?>|<(a)\b([^>]*)>([\s\S]*?)<\/a>/gi;

  const lastIndex = 0;
  const matches: Array<{ full: string; index: number }> = [];

  // Собираем все совпадения верхнего уровня (не вложенные)
  // Используем простой посегментный разбор
  const segments = splitTopLevel(body);

  for (const seg of segments) {
    const s = seg.trim();
    if (!s) continue;

    // H2 раздел
    if (s.startsWith('<div class="gb-h2"')) {
      const m = s.match(/<span>([\s\S]*?)<\/span>/);
      blocks.push({ id: uid(), type: 'heading2', text: decodeHtml(m?.[1] || '') });
      continue;
    }
    // H3 подзаголовок
    if (s.startsWith('<div class="gb-h3"')) {
      const m = s.match(/<span>([\s\S]*?)<\/span>/);
      blocks.push({ id: uid(), type: 'heading3', text: decodeHtml(m?.[1] || '') });
      continue;
    }
    // Шаг
    if (s.startsWith('<div class="gb-step"')) {
      const numM = s.match(/class="gb-step-num"[^>]*>(\d+)</);
      const textM = s.match(/class="gb-step-text">([\s\S]*?)<\/div>/);
      blocks.push({
        id: uid(), type: 'step',
        stepNum: numM ? parseInt(numM[1]) : 1,
        text: textM ? decodeHtml(textM[1]) : '',
      });
      continue;
    }
    // Предупреждение
    if (s.startsWith('<div class="gb-warn"')) {
      const titleM = s.match(/class="gb-warn-title">⚠️\s*([\s\S]*?)<\/div>/);
      const textM = s.match(/class="gb-warn-text">([\s\S]*?)<\/p>/);
      blocks.push({
        id: uid(), type: 'warning',
        icon: titleM ? decodeHtml(titleM[1]).trim() : 'Важно!',
        text: textM ? decodeHtml(textM[1]) : '',
      });
      continue;
    }
    // Подсказка
    if (s.startsWith('<div class="gb-tip"')) {
      const titleM = s.match(/class="gb-tip-title">💡\s*([\s\S]*?)<\/div>/);
      const textM = s.match(/class="gb-tip-text">([\s\S]*?)<\/p>/);
      blocks.push({
        id: uid(), type: 'tip',
        icon: titleM ? decodeHtml(titleM[1]).trim() : 'Подсказка',
        text: textM ? decodeHtml(textM[1]) : '',
      });
      continue;
    }
    // Вложенные пункты
    if (s.startsWith('<div class="gb-sub-wrap"')) {
      const itemMs = [...s.matchAll(/class="gb-sub"[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span><\/div>/g)];
      const items = itemMs.map(m => decodeHtml(m[1]));
      blocks.push({ id: uid(), type: 'sub_steps', items: items.length ? items : [''] });
      continue;
    }
    // Картинка
    if (s.startsWith('<img')) {
      const srcM = s.match(/src="([^"]+)"/);
      blocks.push({ id: uid(), type: 'image', src: srcM?.[1] || '' });
      continue;
    }
    // Подпись картинки
    if (s.startsWith('<p class="gb-img-cap"')) {
      // Добавляем caption к предыдущему image-блоку
      const last = blocks[blocks.length - 1];
      if (last?.type === 'image') {
        const m = s.match(/<p[^>]*>([\s\S]*?)<\/p>/);
        last.caption = m ? decodeHtml(m[1]) : '';
      }
      continue;
    }
    // Разделитель
    if (s.startsWith('<hr')) {
      blocks.push({ id: uid(), type: 'divider' });
      continue;
    }
    // Список ul/ol
    if (s.startsWith('<ul') || s.startsWith('<ol')) {
      const ordered = s.startsWith('<ol');
      const liMs = [...s.matchAll(/<li>([\s\S]*?)<\/li>/gi)];
      const items = liMs.map(m => decodeHtml(m[1]));
      blocks.push({ id: uid(), type: 'list', ordered, items: items.length ? items : [''] });
      continue;
    }
    // Кнопка
    if (s.startsWith('<a') && s.includes('gb-btn')) {
      const hrefM = s.match(/href="([^"]+)"/);
      const labelM = s.match(/>([\s\S]*?)<\/a>/);
      blocks.push({ id: uid(), type: 'button_link', href: hrefM?.[1] || '', label: labelM ? decodeHtml(labelM[1]) : '' });
      continue;
    }
    // Параграф
    if (s.startsWith('<p')) {
      const m = s.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      const text = m ? decodeHtml(m[1]).trim() : '';
      if (text) blocks.push({ id: uid(), type: 'paragraph', text });
      continue;
    }
    // Прочие div — попробуем вытащить текст
    const textOnly = s.replace(/<[^>]+>/g, '').trim();
    if (textOnly) blocks.push({ id: uid(), type: 'paragraph', text: textOnly });
  }

  return blocks.length ? blocks : [{ id: uid(), type: 'paragraph', text: '' }];
}

// Разбивает HTML-строку на сегменты верхнего уровня (не вложенные теги)
function splitTopLevel(html: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      // Самозакрывающийся или закрывающий?
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) { current += html[i++]; continue; }
      const tag = html.slice(i, tagEnd + 1);
      const isClose = tag.startsWith('</');
      const isSelfClose = tag.endsWith('/>') || /^<(img|hr|br|input|meta|link)\b/i.test(tag);

      if (isClose) {
        depth--;
        current += tag;
        i = tagEnd + 1;
        if (depth <= 0) {
          result.push(current.trim());
          current = '';
          depth = 0;
        }
      } else if (isSelfClose) {
        if (depth === 0) {
          if (current.trim()) { result.push(current.trim()); current = ''; }
          result.push(tag);
        } else {
          current += tag;
        }
        i = tagEnd + 1;
      } else {
        if (depth === 0 && current.trim()) {
          result.push(current.trim());
          current = '';
        }
        depth++;
        current += tag;
        i = tagEnd + 1;
      }
    } else {
      current += html[i++];
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function htmlToBlocks(html: string): Block[] {
  if (!html || html.trim() === '') return [{ id: uid(), type: 'paragraph', text: '' }];

  // Сначала пробуем JSON (наш новый формат)
  try {
    const parsed = JSON.parse(html);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // не JSON
  }

  // GB-HTML формат (создан renderBlocksToHtml)
  if (html.includes('class="gb"') || html.includes('.gb{') || html.includes('.gb-step')) {
    const blocks = gbHtmlToBlocks(html);
    if (blocks.length > 0) return blocks;
  }

  // Старый ручной HTML (<!DOCTYPE или сложные custom стили) — оставляем как параграф
  if (html.includes('<!DOCTYPE') || html.includes('class="event-container"') || html.includes('class="guide-wrap"')) {
    return [{ id: uid(), type: 'paragraph', text: html }];
  }

  // Любой другой HTML — пробуем распарсить
  return gbHtmlToBlocks(html);
}

// ─── Рендер блоков → HTML для сохранения ───────────────────────
function blocksToHtml(blocks: Block[]): string {
  // Сохраняем как JSON (будем рендерить на фронте)
  return JSON.stringify(blocks);
}

// ─── Компонент блока в редакторе ───────────────────────────────

interface BlockEditorProps {
  block: Block;
  index: number;
  total: number;
  onChange: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onAddAfter: (id: string, type: BlockType) => void;
}

const STEP_COLOR = '#f97316';

function BlockEditor({ block, index, total, onChange, onDelete, onMove, onAddAfter }: BlockEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingCaption, setUploadingCaption] = useState(false);

  const handleUpload = async (file: File) => {
    onChange(block.id, { uploading: true });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetch(`${API_URL}?action=upload_image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
          body: JSON.stringify({ image: e.target?.result, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) {
          onChange(block.id, { src: data.url, uploading: false });
        } else {
          alert(`Ошибка загрузки: ${data.error || 'неизвестно'}`);
          onChange(block.id, { uploading: false });
        }
      } catch (err) {
        alert(`Ошибка: ${err}`);
        onChange(block.id, { uploading: false });
      }
    };
    reader.readAsDataURL(file);
  };

  const controls = (
    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {index > 0 && (
        <button onClick={() => onMove(block.id, -1)} className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300" title="Вверх">
          <Icon name="ChevronUp" size={14} />
        </button>
      )}
      {index < total - 1 && (
        <button onClick={() => onMove(block.id, 1)} className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300" title="Вниз">
          <Icon name="ChevronDown" size={14} />
        </button>
      )}
      <button onClick={() => onDelete(block.id)} className="p-1 rounded bg-red-900/60 hover:bg-red-700 text-red-400 hover:text-white" title="Удалить">
        <Icon name="Trash2" size={14} />
      </button>
    </div>
  );

  // ── Параграф ──
  if (block.type === 'paragraph') {
    return (
      <div className="relative group">
        {controls}
        <textarea
          value={block.text || ''}
          onChange={e => onChange(block.id, { text: e.target.value })}
          placeholder="Введите текст..."
          rows={3}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 text-sm resize-none outline-none focus:border-slate-500 placeholder-slate-600"
          style={{ userSelect: 'text' }}
        />
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Заголовок H2 ──
  if (block.type === 'heading2') {
    return (
      <div className="relative group">
        {controls}
        <div className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/50 rounded-lg px-4 py-3">
          <div className="w-1 h-7 bg-orange-500 rounded-full flex-shrink-0" />
          <input
            value={block.text || ''}
            onChange={e => onChange(block.id, { text: e.target.value })}
            placeholder="Заголовок раздела..."
            className="flex-1 bg-transparent text-white font-bold text-xl outline-none placeholder-slate-600"
            style={{ userSelect: 'text' }}
          />
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Заголовок H3 ──
  if (block.type === 'heading3') {
    return (
      <div className="relative group">
        {controls}
        <div className="flex items-center gap-3 bg-slate-800/20 border border-slate-700/30 rounded-lg px-4 py-2.5">
          <div className="w-1 h-5 bg-orange-400/60 rounded-full flex-shrink-0" />
          <input
            value={block.text || ''}
            onChange={e => onChange(block.id, { text: e.target.value })}
            placeholder="Подзаголовок..."
            className="flex-1 bg-transparent text-slate-100 font-semibold text-base outline-none placeholder-slate-600"
            style={{ userSelect: 'text' }}
          />
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Шаг ──
  if (block.type === 'step') {
    const num = block.stepNum ?? 1;
    return (
      <div className="relative group">
        {controls}
        <div className="flex gap-3 bg-slate-900/70 border border-slate-700/50 rounded-xl p-4">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-white text-sm select-none"
              style={{ background: STEP_COLOR }}
            >
              {num}
            </div>
            <div className="flex gap-0.5">
              <button
                onClick={() => onChange(block.id, { stepNum: Math.max(1, num - 1) })}
                className="text-slate-600 hover:text-slate-400 text-xs px-1"
              >−</button>
              <button
                onClick={() => onChange(block.id, { stepNum: num + 1 })}
                className="text-slate-600 hover:text-slate-400 text-xs px-1"
              >+</button>
            </div>
          </div>
          <textarea
            value={block.text || ''}
            onChange={e => onChange(block.id, { text: e.target.value })}
            placeholder="Описание шага..."
            rows={3}
            className="flex-1 bg-transparent text-slate-200 text-sm resize-none outline-none placeholder-slate-600"
            style={{ userSelect: 'text' }}
          />
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Предупреждение ──
  if (block.type === 'warning') {
    return (
      <div className="relative group">
        {controls}
        <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
            <Icon name="AlertTriangle" size={16} />
            <input
              value={block.icon || 'Важно!'}
              onChange={e => onChange(block.id, { icon: e.target.value })}
              className="bg-transparent outline-none text-amber-400 font-bold w-full"
              placeholder="Заголовок предупреждения..."
              style={{ userSelect: 'text' }}
            />
          </div>
          <textarea
            value={block.text || ''}
            onChange={e => onChange(block.id, { text: e.target.value })}
            placeholder="Текст предупреждения..."
            rows={3}
            className="w-full bg-transparent text-amber-200/80 text-sm resize-none outline-none placeholder-amber-900"
            style={{ userSelect: 'text' }}
          />
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Подсказка ──
  if (block.type === 'tip') {
    return (
      <div className="relative group">
        {controls}
        <div className="bg-teal-950/40 border border-teal-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-sm mb-2">
            <Icon name="Lightbulb" size={16} />
            <input
              value={block.icon || 'Подсказка'}
              onChange={e => onChange(block.id, { icon: e.target.value })}
              className="bg-transparent outline-none text-teal-400 font-bold w-full"
              placeholder="Заголовок подсказки..."
              style={{ userSelect: 'text' }}
            />
          </div>
          <textarea
            value={block.text || ''}
            onChange={e => onChange(block.id, { text: e.target.value })}
            placeholder="Текст подсказки..."
            rows={3}
            className="w-full bg-transparent text-teal-200/80 text-sm resize-none outline-none placeholder-teal-900"
            style={{ userSelect: 'text' }}
          />
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Изображение ──
  if (block.type === 'image') {
    return (
      <div className="relative group">
        {controls}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
          {block.src ? (
            <div className="relative">
              <img
                src={block.src}
                alt={block.caption || ''}
                className="w-full max-w-2xl rounded-lg border border-slate-700 object-cover"
                style={{ maxHeight: 400 }}
              />
              <button
                onClick={() => onChange(block.id, { src: '' })}
                className="absolute top-2 right-2 bg-red-900/80 hover:bg-red-700 text-white rounded-full p-1"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          ) : (
            <div>
              {block.uploading ? (
                <div className="flex items-center gap-3 text-slate-400 py-6 justify-center">
                  <Icon name="Loader2" size={20} className="animate-spin" />
                  Загружаем изображение...
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 hover:border-orange-500/50 rounded-lg py-10 flex flex-col items-center gap-2 cursor-pointer transition-colors text-slate-500 hover:text-slate-300"
                >
                  <Icon name="ImagePlus" size={32} />
                  <span className="text-sm">Нажмите чтобы загрузить изображение</span>
                  <span className="text-xs text-slate-600">JPG, PNG, GIF, WebP · до 5 МБ</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="или вставьте URL изображения..."
                  className="bg-slate-800 border-slate-600 text-white text-xs h-8 flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) onChange(block.id, { src: v }); } }}
                  onBlur={e => { const v = e.target.value.trim(); if (v) onChange(block.id, { src: v }); }}
                />
              </div>
            </div>
          )}
          {block.src && (
            <Input
              value={block.caption || ''}
              onChange={e => onChange(block.id, { caption: e.target.value })}
              placeholder="Подпись к изображению (необязательно)..."
              className="bg-slate-800 border-slate-600 text-slate-300 text-xs h-8"
            />
          )}
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Разделитель ──
  if (block.type === 'divider') {
    return (
      <div className="relative group py-2">
        {controls}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <Icon name="Minus" size={14} className="text-slate-600" />
          <div className="flex-1 h-px bg-slate-700" />
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Список ──
  if (block.type === 'list') {
    const items = block.items || [''];
    return (
      <div className="relative group">
        {controls}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => onChange(block.id, { ordered: false })}
              className={`px-2 py-1 rounded text-xs ${!block.ordered ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              • Маркированный
            </button>
            <button
              onClick={() => onChange(block.id, { ordered: true })}
              className={`px-2 py-1 rounded text-xs ${block.ordered ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              1. Нумерованный
            </button>
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-slate-500 text-xs w-5 text-right flex-shrink-0">
                {block.ordered ? `${i + 1}.` : '•'}
              </span>
              <input
                value={item}
                onChange={e => {
                  const newItems = [...items];
                  newItems[i] = e.target.value;
                  onChange(block.id, { items: newItems });
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newItems = [...items];
                    newItems.splice(i + 1, 0, '');
                    onChange(block.id, { items: newItems });
                  }
                  if (e.key === 'Backspace' && item === '' && items.length > 1) {
                    e.preventDefault();
                    const newItems = items.filter((_, idx) => idx !== i);
                    onChange(block.id, { items: newItems });
                  }
                }}
                placeholder={`Пункт ${i + 1}...`}
                className="flex-1 bg-transparent text-slate-200 text-sm outline-none placeholder-slate-600"
                style={{ userSelect: 'text' }}
              />
              {items.length > 1 && (
                <button
                  onClick={() => onChange(block.id, { items: items.filter((_, idx) => idx !== i) })}
                  className="text-slate-600 hover:text-red-400"
                >
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => onChange(block.id, { items: [...items, ''] })}
            className="text-orange-500 hover:text-orange-400 text-xs flex items-center gap-1 mt-1"
          >
            <Icon name="Plus" size={12} /> Добавить пункт
          </button>
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Кнопка-ссылка ──
  if (block.type === 'button_link') {
    return (
      <div className="relative group">
        {controls}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-2">
          <p className="text-slate-500 text-xs mb-2 flex items-center gap-1"><Icon name="Link" size={12} /> Кнопка-ссылка</p>
          <Input
            value={block.label || ''}
            onChange={e => onChange(block.id, { label: e.target.value })}
            placeholder="Текст кнопки..."
            className="bg-slate-800 border-slate-600 h-8 text-sm"
            style={{ color: '#fff' }}
          />
          <Input
            value={block.href || ''}
            onChange={e => onChange(block.id, { href: e.target.value })}
            placeholder="URL ссылки (необязательно)..."
            className="bg-slate-800 border-slate-600 h-8 text-sm"
            style={{ color: '#94a3b8' }}
          />
          <div className="pt-2">
            <p className="text-slate-600 text-xs mb-2">Предпросмотр:</p>
            <a
              href={block.href || '#'}
              target="_blank"
              rel="noreferrer"
              style={{ background: '#f97316', color: '#ffffff', display: 'inline-block', padding: '10px 22px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
            >
              {block.label || 'Текст кнопки'}
            </a>
          </div>
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  // ── Вложенные пункты (sub_steps) ──
  if (block.type === 'sub_steps') {
    const items = block.items || [''];
    return (
      <div className="relative group">
        {controls}
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-4 space-y-2 ml-4 border-l-2 border-l-orange-600/30">
          <p className="text-slate-500 text-xs mb-2 flex items-center gap-1"><Icon name="CornerDownRight" size={12} /> Вложенные пункты</p>
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-orange-500/70 text-sm flex-shrink-0">—</span>
              <input
                value={item}
                onChange={e => {
                  const newItems = [...items];
                  newItems[i] = e.target.value;
                  onChange(block.id, { items: newItems });
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newItems = [...items];
                    newItems.splice(i + 1, 0, '');
                    onChange(block.id, { items: newItems });
                  }
                  if (e.key === 'Backspace' && item === '' && items.length > 1) {
                    e.preventDefault();
                    const newItems = items.filter((_, idx) => idx !== i);
                    onChange(block.id, { items: newItems });
                  }
                }}
                placeholder={`Пункт ${i + 1}... (поддерживает **жирный**, \`клавиша\`)`}
                className="flex-1 bg-transparent text-slate-300 text-sm outline-none placeholder-slate-600"
                style={{ userSelect: 'text' }}
              />
              {items.length > 1 && (
                <button onClick={() => onChange(block.id, { items: items.filter((_, idx) => idx !== i) })} className="text-slate-600 hover:text-red-400">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => onChange(block.id, { items: [...items, ''] })}
            className="text-orange-500/70 hover:text-orange-400 text-xs flex items-center gap-1 mt-1"
          >
            <Icon name="Plus" size={12} /> Добавить пункт
          </button>
        </div>
        <AddBlockButton blockId={block.id} onAdd={onAddAfter} />
      </div>
    );
  }

  return null;
}

// ─── Кнопка добавления блока ────────────────────────────────────
function AddBlockButton({ blockId, onAdd }: { blockId: string; onAdd: (id: string, type: BlockType) => void }) {
  const [open, setOpen] = useState(false);

  const blocks: { type: BlockType; label: string; icon: string; desc: string }[] = [
    { type: 'paragraph', label: 'Текст', icon: 'AlignLeft', desc: 'Обычный абзац' },
    { type: 'heading2', label: 'Раздел', icon: 'Heading2', desc: 'Крупный заголовок' },
    { type: 'heading3', label: 'Подзаголовок', icon: 'Heading3', desc: 'Заголовок поменьше' },
    { type: 'step', label: 'Шаг', icon: 'ListOrdered', desc: 'Пронумерованный шаг' },
    { type: 'sub_steps', label: 'Вложенные', icon: 'CornerDownRight', desc: 'Пункты со стрелкой' },
    { type: 'warning', label: 'Предупреждение', icon: 'AlertTriangle', desc: 'Важная информация' },
    { type: 'tip', label: 'Подсказка', icon: 'Lightbulb', desc: 'Полезный совет' },
    { type: 'image', label: 'Изображение', icon: 'ImagePlus', desc: 'Фото или скриншот' },
    { type: 'list', label: 'Список', icon: 'List', desc: 'Маркированный / нумерованный' },
    { type: 'button_link', label: 'Кнопка', icon: 'Link', desc: 'Кнопка со ссылкой' },
    { type: 'divider', label: 'Разделитель', icon: 'Minus', desc: 'Горизонтальная линия' },
  ];

  return (
    <div className="flex justify-center my-1">
      {open ? (
        <div className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 backdrop-blur">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-2">
            {blocks.map(b => (
              <button
                key={b.type}
                onClick={() => { onAdd(blockId, b.type); setOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-center"
              >
                <Icon name={b.icon} size={18} fallback="Plus" />
                <span className="text-xs leading-tight">{b.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-400 text-xs w-full text-center">отмена</button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-slate-700 hover:text-orange-500 text-xs py-1 px-3 rounded-full hover:bg-slate-800/60 transition-all opacity-0 group-hover:opacity-100"
          style={{ opacity: undefined }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '')}
        >
          <Icon name="Plus" size={14} />
          добавить блок
        </button>
      )}
    </div>
  );
}

// ─── Рендер блоков в HTML (для сохранения и показа на сайте) ───

export function renderBlocksToHtml(blocks: Block[]): string {
  const parts: string[] = [];

  // Добавляем общие стили один раз
  parts.push(`<style>
.gb{font-family:sans-serif;line-height:1.7;color:#e2e8f0;}
.gb-h2{display:flex;align-items:center;gap:10px;margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid #1e293b;}
.gb-h2-bar{width:4px;height:28px;background:#f97316;border-radius:2px;flex-shrink:0;}
.gb-h2 span{color:#fff;font-size:1.4rem;font-weight:700;}
.gb-h3{display:flex;align-items:center;gap:8px;margin:20px 0 8px;}
.gb-h3-bar{width:3px;height:20px;background:#f97316;opacity:.6;border-radius:2px;flex-shrink:0;}
.gb-h3 span{color:#e2e8f0;font-size:1.1rem;font-weight:600;}
.gb-p{color:#cbd5e1;margin:0 0 12px;font-size:0.95rem;}
.gb-step{display:flex;gap:14px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:14px 18px;margin:10px 0;}
.gb-step-num{min-width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:0.95rem;flex-shrink:0;margin-top:2px;}
.gb-step-text{color:#cbd5e1;font-size:0.93rem;line-height:1.65;}
.gb-warn{background:#431407;border:1px solid #c2410c;border-radius:10px;padding:14px 18px;margin:16px 0;}
.gb-warn-title{color:#fb923c;font-weight:700;font-size:0.95rem;margin:0 0 8px;}
.gb-warn-text{color:#fed7aa;font-size:0.92rem;margin:0;}
.gb-tip{background:#042f2e;border:1px solid #0f766e;border-radius:10px;padding:14px 18px;margin:16px 0;}
.gb-tip-title{color:#2dd4bf;font-weight:700;font-size:0.95rem;margin:0 0 8px;}
.gb-tip-text{color:#99f6e4;font-size:0.92rem;margin:0;}
.gb-img{width:100%;max-width:720px;height:auto;border-radius:10px;border:1px solid #334155;margin:10px 0;display:block;}
.gb-img-cap{text-align:center;color:#64748b;font-size:0.78rem;margin:-4px 0 14px;}
.gb-hr{border:none;border-top:1px solid #334155;margin:24px 0;}
.gb-ul,.gb-ol{margin:10px 0;padding-left:24px;color:#cbd5e1;font-size:0.93rem;}
.gb-ul li,.gb-ol li{margin-bottom:6px;}
.gb-btn{display:inline-block;padding:10px 22px;background:#f97316;color:#ffffff !important;border-radius:8px;font-weight:600;font-size:0.9rem;text-decoration:none !important;margin:8px 0;}
.gb-btn:hover{background:#ea6c0a;color:#ffffff !important;}
.gb-sub-wrap{margin:6px 0 6px 16px;display:flex;flex-direction:column;gap:6px;}
.gb-sub{display:flex;align-items:flex-start;gap:10px;color:#94a3b8;font-size:0.9rem;}
.gb-sub-arrow{color:#f97316;font-weight:700;flex-shrink:0;margin-top:1px;}
@media(max-width:600px){.gb-step{padding:10px 12px;}.gb-h2 span{font-size:1.1rem;}.gb-img{max-width:100%;}}
</style>
<div class="gb">`);

  for (const b of blocks) {
    if (b.type === 'paragraph' && b.text) {
      // Поддержка базового форматирования текста
      const html = b.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:#1e293b;padding:1px 6px;border-radius:4px;font-size:0.85em;color:#e2e8f0;">$1</code>')
        .replace(/\n/g, '<br/>');
      parts.push(`<p class="gb-p">${html}</p>`);
    }
    if (b.type === 'heading2' && b.text) {
      const t = b.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      parts.push(`<div class="gb-h2"><div class="gb-h2-bar"></div><span>${t}</span></div>`);
    }
    if (b.type === 'heading3' && b.text) {
      const t = b.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      parts.push(`<div class="gb-h3"><div class="gb-h3-bar"></div><span>${t}</span></div>`);
    }
    if (b.type === 'step') {
      const num = b.stepNum ?? 1;
      const text = (b.text || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:#1e293b;padding:1px 6px;border-radius:4px;font-size:0.85em;color:#e2e8f0;">$1</code>')
        .replace(/\n/g, '<br/>');
      parts.push(`<div class="gb-step"><div class="gb-step-num" style="background:#f97316">${num}</div><div class="gb-step-text">${text}</div></div>`);
    }
    if (b.type === 'warning') {
      const title = (b.icon || 'Важно!').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const text = (b.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
      parts.push(`<div class="gb-warn"><div class="gb-warn-title">⚠️ ${title}</div><p class="gb-warn-text">${text}</p></div>`);
    }
    if (b.type === 'tip') {
      const title = (b.icon || 'Подсказка').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const text = (b.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
      parts.push(`<div class="gb-tip"><div class="gb-tip-title">💡 ${title}</div><p class="gb-tip-text">${text}</p></div>`);
    }
    if (b.type === 'image' && b.src) {
      const alt = (b.caption || '').replace(/"/g, '&quot;');
      const cap = (b.caption || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      parts.push(`<img class="gb-img" src="${b.src}" alt="${alt}" />`);
      if (cap) parts.push(`<p class="gb-img-cap">${cap}</p>`);
    }
    if (b.type === 'divider') {
      parts.push(`<hr class="gb-hr" />`);
    }
    if (b.type === 'list' && b.items?.length) {
      const tag = b.ordered ? 'ol' : 'ul';
      const cls = b.ordered ? 'gb-ol' : 'gb-ul';
      const items = b.items.filter(i => i.trim()).map(i => {
        const t = i.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>');
        return `<li>${t}</li>`;
      }).join('');
      parts.push(`<${tag} class="${cls}">${items}</${tag}>`);
    }
    if (b.type === 'button_link' && b.label) {
      const label = b.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const href = b.href || '#';
      parts.push(`<a href="${href}" target="_blank" rel="noopener noreferrer" class="gb-btn" style="color:#ffffff !important;text-decoration:none;">${label}</a>`);
    }
    if (b.type === 'sub_steps' && b.items?.length) {
      const rendered = b.items.filter(i => i.trim()).map(i => {
        const t = i
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code style="display:inline-block;background:#1e293b;border:1px solid #475569;color:#f8fafc;font-family:monospace;font-size:0.82em;padding:1px 7px;border-radius:4px;margin:0 2px;">$1</code>');
        return `<div class="gb-sub"><span class="gb-sub-arrow">—</span><span>${t}</span></div>`;
      }).join('');
      parts.push(`<div class="gb-sub-wrap">${rendered}</div>`);
    }
  }

  parts.push('</div>');
  return parts.join('\n');
}

// ─── Основной компонент редактора ───────────────────────────────

export default function GuideEditor({ value, onChange }: GuideEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const parsed = htmlToBlocks(value);
    // Если пришёл старый HTML — показываем предупреждение но не ломаем
    return parsed;
  });
  const [showPreview, setShowPreview] = useState(false);
  // Legacy только если это старый ручной HTML (не наш GB-формат)
  const isLegacy = value && (
    value.includes('<!DOCTYPE') ||
    value.includes('class="event-container"') ||
    value.includes('class="guide-wrap"') ||
    value.includes('class="guide-header"')
  );

  const syncToParent = useCallback((newBlocks: Block[]) => {
    onChange(renderBlocksToHtml(newBlocks));
  }, [onChange]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      syncToParent(next);
      return next;
    });
  }, [syncToParent]);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const next = prev.filter(b => b.id !== id);
      const result = next.length === 0 ? [{ id: uid(), type: 'paragraph' as BlockType, text: '' }] : next;
      syncToParent(result);
      return result;
    });
  }, [syncToParent]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      syncToParent(next);
      return next;
    });
  }, [syncToParent]);

  const addAfter = useCallback((afterId: string, type: BlockType) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const newBlock: Block = { id: uid(), type, stepNum: type === 'step' ? 1 : undefined, items: (type === 'list' || type === 'sub_steps') ? [''] : undefined };
      const next = [...prev];
      next.splice(idx + 1, 0, newBlock);
      syncToParent(next);
      return next;
    });
  }, [syncToParent]);

  const addFirst = (type: BlockType) => {
    const newBlock: Block = { id: uid(), type, stepNum: type === 'step' ? 1 : undefined, items: (type === 'list' || type === 'sub_steps') ? [''] : undefined };
    setBlocks(prev => {
      const next = [...prev, newBlock];
      syncToParent(next);
      return next;
    });
  };

  const previewHtml = renderBlocksToHtml(blocks);

  return (
    <div className="space-y-3">
      {/* Панель быстрых вставок */}
      <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl">
        <span className="text-slate-500 text-xs self-center mr-1">Добавить:</span>
        {[
          { type: 'paragraph' as BlockType, label: 'Текст', icon: 'AlignLeft' },
          { type: 'heading2' as BlockType, label: 'Раздел', icon: 'Heading2' },
          { type: 'step' as BlockType, label: 'Шаг', icon: 'ListOrdered' },
          { type: 'sub_steps' as BlockType, label: 'Вложенные', icon: 'CornerDownRight' },
          { type: 'warning' as BlockType, label: 'Важно', icon: 'AlertTriangle' },
          { type: 'tip' as BlockType, label: 'Совет', icon: 'Lightbulb' },
          { type: 'image' as BlockType, label: 'Картинку', icon: 'ImagePlus' },
          { type: 'list' as BlockType, label: 'Список', icon: 'List' },
          { type: 'button_link' as BlockType, label: 'Кнопку', icon: 'Link' },
          { type: 'divider' as BlockType, label: 'Линию', icon: 'Minus' },
        ].map(item => (
          <button
            key={item.type}
            onClick={() => addFirst(item.type)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors border border-slate-700 hover:border-slate-500"
          >
            <Icon name={item.icon} size={13} fallback="Plus" />
            {item.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border ${showPreview ? 'bg-orange-600/20 border-orange-600/40 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
        >
          <Icon name={showPreview ? 'EyeOff' : 'Eye'} size={13} />
          {showPreview ? 'Редактор' : 'Предпросмотр'}
        </button>
      </div>

      {/* Предупреждение для старых статей */}
      {isLegacy && (
        <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl px-4 py-3 text-amber-300 text-sm flex items-start gap-2">
          <Icon name="AlertTriangle" size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <strong>Статья в старом формате.</strong> Контент отображается в режиме совместимости.
            Чтобы редактировать визуально — очистите поле и начните заново.
            <button
              className="ml-2 underline text-amber-400 hover:text-amber-200"
              onClick={() => {
                const fresh = [{ id: uid(), type: 'paragraph' as BlockType, text: '' }];
                setBlocks(fresh);
                syncToParent(fresh);
              }}
            >
              Начать заново
            </button>
          </div>
        </div>
      )}

      {/* Превью или редактор */}
      {showPreview ? (
        <div
          className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 min-h-64"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <div className="space-y-2 min-h-32">
          {blocks.length === 0 && (
            <div className="text-center text-slate-600 py-12 border-2 border-dashed border-slate-800 rounded-xl">
              <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Статья пуста. Нажмите кнопку выше чтобы добавить блок.</p>
            </div>
          )}
          {blocks.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              onChange={updateBlock}
              onDelete={deleteBlock}
              onMove={moveBlock}
              onAddAfter={addAfter}
            />
          ))}
        </div>
      )}

      {/* Подсказки по форматированию */}
      {!showPreview && !isLegacy && (
        <div className="text-slate-700 text-xs px-1 space-y-0.5">
          <p>Форматирование в тексте: <span className="text-slate-600">**жирный**</span> · <span className="text-slate-600">*курсив*</span> · <span className="text-slate-600">`код`</span></p>
        </div>
      )}
    </div>
  );
}