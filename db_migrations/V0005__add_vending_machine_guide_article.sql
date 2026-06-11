INSERT INTO articles (title, description, content, category_id, author_id, preview_image, is_hidden)
VALUES (
  'Кастомные торговые аппараты',
  'Как настроить торговый аппарат для продажи кастомных предметов другим игрокам.',
  '<style>
.guide-wrap{font-family:sans-serif;line-height:1.7;color:#e2e8f0;}
.guide-header{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border:1px solid #334155;border-radius:12px;padding:24px 28px;margin-bottom:28px;border-left:4px solid #f97316;}
.guide-header h2{margin:0 0 8px 0;color:#fff;font-size:1.5rem;font-weight:700;}
.guide-header p{margin:0;color:#94a3b8;font-size:0.95rem;}
.section-title{display:flex;align-items:center;gap:10px;color:#f97316;font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:32px 0 14px 0;padding-bottom:8px;border-bottom:1px solid #1e293b;}
.step-block{display:flex;gap:16px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px 20px;margin-bottom:12px;}
.step-num{background:#f97316;color:#fff;font-weight:800;font-size:1rem;min-width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}
.step-text{color:#cbd5e1;font-size:0.95rem;}
.step-text strong{color:#f1f5f9;}
.key{display:inline-block;background:#1e293b;border:1px solid #475569;color:#f8fafc;font-family:monospace;font-size:0.85rem;padding:1px 8px;border-radius:5px;margin:0 2px;}
.screenshot{width:100%;max-width:720px;height:auto;border-radius:10px;border:1px solid #334155;margin:14px 0;display:block;}
.screenshot-caption{text-align:center;color:#64748b;font-size:0.8rem;margin:-8px 0 16px 0;}
.sub-step{display:flex;align-items:flex-start;gap:10px;color:#94a3b8;font-size:0.9rem;margin:8px 0 8px 16px;}
.sub-step::before{content:"—";color:#f97316;font-weight:bold;flex-shrink:0;}
.warning-box{background:#431407;border:1px solid #c2410c;border-radius:10px;padding:16px 20px;margin:24px 0;}
.warn-title{color:#fb923c;font-weight:700;font-size:1rem;margin-bottom:8px;}
.warning-box p{color:#fed7aa;margin:6px 0;font-size:0.92rem;line-height:1.6;}
.tip-box{background:#042f2e;border:1px solid #0f766e;border-radius:10px;padding:16px 20px;margin:24px 0;}
.tip-title{color:#2dd4bf;font-weight:700;font-size:1rem;margin-bottom:8px;}
.tip-box p{color:#99f6e4;margin:5px 0;font-size:0.92rem;}
.hl{color:#f97316;font-weight:600;}
.hl-green{color:#4ade80;font-weight:600;}
@media(max-width:600px){.guide-header{padding:16px;}.guide-header h2{font-size:1.2rem;}.step-block{padding:12px 14px;}}
</style>
<div class="guide-wrap">
<div class="guide-header">
<h2>🛒 Кастомные торговые аппараты</h2>
<p>Полное руководство по настройке торгового автомата для обмена кастомными предметами с другими игроками</p>
</div>

<div class="section-title">⚒️ Шаг 1 — Скрафтить торговый аппарат</div>
<div class="step-block">
<div class="step-num">1</div>
<div class="step-text">Нажмите клавишу <span class="key">Q</span> чтобы открыть меню крафта. Найдите <strong>Торговый автомат</strong> и убедитесь что у вас есть нужные материалы. Требуется <strong>Верстак 1-го уровня</strong>.</div>
</div>
<img class="screenshot" src="https://cdn.poehali.dev/projects/21c5f7f9-6172-405c-820b-334660b805c6/bucket/f785056a-865c-437f-a146-851f5237af84.png" alt="Крафт торгового автомата" />
<p class="screenshot-caption">Меню крафта — нужные материалы для изготовления торгового автомата</p>

<div class="section-title">🏠 Шаг 2 — Установить и защитить аппарат</div>
<div class="step-block">
<div class="step-num">2</div>
<div class="step-text">Поставьте аппарат — <strong>желательно в дверной проём</strong>. Обязательно <span class="hl">защитите заднюю сторону</span> от доступа других игроков: если кто-то доберётся до задней панели — он заберёт всё содержимое.</div>
</div>
<img class="screenshot" src="https://cdn.poehali.dev/projects/21c5f7f9-6172-405c-820b-334660b805c6/bucket/8cd36f53-ed6a-4dde-8148-687883f949fb.png" alt="Торговый аппарат установлен" />
<p class="screenshot-caption">Аппарат установлен. Задняя панель должна быть надёжно защищена.</p>

<div class="section-title">🔓 Шаг 3 — Открыть хранилище и заполнить предметами</div>
<div class="step-block">
<div class="step-num">3</div>
<div class="step-text">Подойдите к <strong>задней стороне</strong> аппарата и <strong>зажмите</strong> клавишу <span class="key">E</span>. В круговом меню выберите <span class="hl">"Открыть"</span>.</div>
</div>
<img class="screenshot" src="https://cdn.poehali.dev/projects/21c5f7f9-6172-405c-820b-334660b805c6/bucket/12fafc49-d8a4-4f63-8e58-d83191fea6c9.png" alt="Круговое меню — Открыть" />
<p class="screenshot-caption">Круговое меню взаимодействия — нажмите «Открыть»</p>
<div class="step-block">
<div class="step-num">4</div>
<div class="step-text">Откроется хранилище аппарата. <strong>Поместите туда все предметы</strong>, которые планируете продавать или использовать в обменах.</div>
</div>
<img class="screenshot" src="https://cdn.poehali.dev/projects/21c5f7f9-6172-405c-820b-334660b805c6/bucket/6e3b19c3-288f-4fb8-abc7-72f07d9bf2b3.png" alt="Инвентарь торгового автомата" />
<p class="screenshot-caption">Инвентарь торгового аппарата — сюда кладём предметы для торговли</p>

<div class="section-title">💰 Шаг 4 — Настроить лоты для продажи</div>
<div class="step-block">
<div class="step-num">5</div>
<div class="step-text">Нажмите кнопку <span class="hl">"Управлять"</span> в нижней части окна инвентаря аппарата.</div>
</div>
<img class="screenshot" src="https://cdn.poehali.dev/projects/21c5f7f9-6172-405c-820b-334660b805c6/bucket/b62a9317-5f00-4068-9fd5-b553654c2a61.png" alt="Кнопка Управлять" />
<p class="screenshot-caption">Нажмите «Управлять» чтобы перейти к настройке лотов</p>
<div class="step-block">
<div class="step-num">6</div>
<div class="step-text">Нажмите <span class="hl">+</span> чтобы добавить новый лот. В выпадающем списке выберите предмет из хранилища — или <span class="hl-green">DP валюту</span>.</div>
</div>
<div class="step-block">
<div class="step-num">7</div>
<div class="step-text">Нажмите второй <span class="hl">+</span> чтобы выбрать <strong>что вы хотите получить в обмен</strong>:
<div class="sub-step">Выберите <span class="hl-green">DP валюту</span> или найдите любой предмет через поиск</div>
<div class="sub-step">Для некоторых предметов нужны оригинальные названия: например <span class="key">Scrap</span> (металлолом)</div>
<div class="sub-step">Укажите <strong>количество</strong> обоих предметов</div>
<div class="sub-step">Нажмите <span class="hl">"Создать"</span> — готово!</div>
</div>
</div>

<div class="warning-box">
<div class="warn-title">⚠️ Важно — баланс DP</div>
<p>Если вы меняете <strong>DP на предмет</strong> (отдаёте DP покупателю) — нужно заранее пополнить баланс аппарата.</p>
<p>Нажмите <strong>"Пополнить"</strong> (рядом с кнопкой "Управлять") → введите количество DP в поле <strong>Deposit amount</strong> → нажмите <span class="key">Enter</span></p>
<p>Если вы продаёте предмет <strong>за DP</strong> — всё происходит автоматически, пополнять ничего не нужно.</p>
</div>
<div class="tip-box">
<div class="tip-title">💡 Вывод DP с баланса</div>
<p>Нажмите <strong>"Вывести"</strong> рядом с кнопкой "Управлять" — вся накопленная сумма мгновенно переведётся вам.</p>
</div>
</div>',
  2,
  1,
  'https://cdn.poehali.dev/projects/21c5f7f9-6172-405c-820b-334660b805c6/bucket/f785056a-865c-437f-a146-851f5237af84.png',
  false
);

INSERT INTO article_categories (article_id, category_id)
SELECT id, 2 FROM articles WHERE title = 'Кастомные торговые аппараты' ORDER BY id DESC LIMIT 1;
