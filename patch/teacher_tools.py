# -*- coding: utf-8 -*-
"""What a teacher misses first, on top of the school page: task templates, deadline reminders, the
«who has not handed in» view with a nudge, the course gradebook with a CSV download, and each student's
progress. Called by patch_school.py on the already patched page."""


def apply(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:100])
        s = s.replace(a, b)

    # ---------- CSS ----------
    rep('''.mem-seg { margin-top: -4px; }''', '''.mem-seg { margin-top: -4px; }
.rv-tools { display: grid; gap: 8px; }
.rv-acts { display: flex; flex-wrap: wrap; gap: 6px; }
.book-wrap { max-width: 100%; overflow-x: auto; border: 1px solid var(--line); border-radius: var(--r-s); }
.book { border-collapse: collapse; font-size: var(--t-sm); font-variant-numeric: tabular-nums; }
.book th, .book td { padding: 6px 8px; border-bottom: 1px solid var(--line); text-align: center; white-space: nowrap; }
.book th { position: sticky; top: 0; background: var(--surface-2); font-size: var(--t-xs); font-weight: 600; color: var(--muted); }
.book th:first-child, .book td:first-child { position: sticky; left: 0; z-index: 1; text-align: left; background: var(--surface); font-weight: 500; }
.book th:first-child { background: var(--surface-2); z-index: 2; }
.book th .due { display: block; font-weight: 400; }
.book td button { min-width: 2.4em; padding: 2px 6px; border: 0; border-radius: var(--r-f); background: var(--surface-2); color: var(--muted); font-weight: 600; }
.book td button.ok { color: var(--online); background: color-mix(in srgb, var(--online) 14%, transparent); }
.book td button.rework, .book td button.late { color: var(--danger); background: color-mix(in srgb, var(--danger) 12%, transparent); }
.book td button.sub, .book td button.again { color: var(--accent); background: var(--accent-soft); }
.book td.sum { color: var(--muted); }
.book-legend { margin: 0; font-size: var(--t-xs); color: var(--muted); }
.prog { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.prog button { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 36px; padding: 6px 10px; border: 0; border-radius: var(--r-s); background: var(--surface-2); color: var(--ink); text-align: left; font-size: var(--t-sm); }
.prog button span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }''')

    # ---------- markup ----------
    rep('''    <h2 id="taskTitle">Новое задание</h2>
    <label>Название''', '''    <h2 id="taskTitle">Новое задание</h2>
    <label>Шаблон<select class="field" id="tkTpl"><option value="">Без шаблона</option></select></label>
    <label>Название''')
    rep('''    <p id="rvStat"></p>
    <div class="rv-list" id="rvList"></div>''', '''    <p id="rvStat"></p>
    <div class="rv-tools">
      <div class="seg" id="rvFilter" role="group" aria-label="Кого показать"></div>
      <div class="rv-acts">
        <button class="btn-s primary" type="button" id="rvNudge">Напомнить не сдавшим</button>
        <button class="btn-s" type="button" id="rvCopy">Скопировать, кто не сдал</button>
        <button class="btn-s" type="button" id="rvBook">Журнал курса</button>
      </div>
    </div>
    <div class="rv-list" id="rvList"></div>''')
    rep('''<div class="overlay" id="courseBox" hidden>''', '''<div class="overlay" id="bookBox" hidden>
  <div class="card wide" role="dialog" aria-labelledby="bookTitle">
    <h2 id="bookTitle">Журнал курса</h2>
    <p id="bookStat"></p>
    <div class="book-wrap" id="bookWrap"></div>
    <p class="book-legend">Оценка или ✓ проверено · • ждёт проверки · ↺ на доработке · — не сдано · ✕ срок прошёл. Нажми на ячейку, чтобы открыть работы по заданию.</p>
    <div class="rowb"><button class="btn sec" type="button" id="bookCsv">Скачать CSV</button><button class="btn sec" type="button" id="bookClose">Закрыть</button></div>
  </div>
</div>

<div class="overlay" id="courseBox" hidden>''')

    # ---------- data: reminders are marked messages ----------
    rep('''    if ((it.sub === 1 || it.sub === true) && o.reply) o.sub = 1;''', '''    if ((it.sub === 1 || it.sub === true) && o.reply) o.sub = 1;
    if (it.remind === 1 && o.reply) o.remind = 1;''')
    rep('''    if (m.sub && SC.tasks.has(m.reply)) bub.append(h("div", "sub-chip", "Сдаёт задание"));''',
        '''    if (m.sub && SC.tasks.has(m.reply)) bub.append(h("div", "sub-chip", "Сдаёт задание"));
    if (m.remind && SC.tasks.has(m.reply)) bub.append(h("div", "sub-chip", "Напоминание о сроке"));''')
    # a quote may lead to another channel: go there first
    rep('''  function jumpTo(id) {
    const el = $("list").querySelector('[data-id="' + CSS.escape(id) + '"]');''', '''  function jumpTo(id) {
    const target = collect().byId.get(id);
    if (target && msgCh(target) !== S.ch && !$("list").querySelector('[data-id="' + CSS.escape(id) + '"]')) { switchChannel(msgCh(target)); S.pendingJump = id; render(); return; }
    const el = $("list").querySelector('[data-id="' + CSS.escape(id) + '"]');''')

    # ---------- the task card: a reminder button for the team ----------
    rep('''      const e = btn("btn-s", "Изменить");
      e.addEventListener("click", () => openTaskForm(t.id));
      foot.append(b, e);''', '''      const e = btn("btn-s", "Изменить");
      e.addEventListener("click", () => openTaskForm(t.id));
      const r = btn("btn-s", "Напомнить");
      r.title = "Напоминание о сроке в " + chLabel(remindChannel(t));
      r.addEventListener("click", () => remindAll(t));
      foot.append(b, r, e);''')

    # ---------- the review: a filter and the not-handed-in tools ----------
    rep('''    const rows = students().map((n) => ({ n, w: workOf(t, n) })).sort((x, y) => ST_ORDER[x.w.st] - ST_ORDER[y.w.st] || x.n.localeCompare(y.n, "ru"));
    const list = $("rvList");
    list.replaceChildren();
    if (!rows.length) list.append(h("p", "p-intro", "Учеников пока нет: они появятся, когда напишут в чат или сдадут работу."));''',
        '''    const all = students().map((n) => ({ n, w: workOf(t, n) })).sort((x, y) => ST_ORDER[x.w.st] - ST_ORDER[y.w.st] || x.n.localeCompare(y.n, "ru"));
    const missing = all.filter((r) => r.w.st === "none" || r.w.st === "late");
    const waiting = all.filter((r) => r.w.st === "sub" || r.w.st === "again");
    const seg = $("rvFilter");
    seg.replaceChildren();
    for (const [v, label] of [["all", "Все · " + all.length], ["wait", "Ждут проверки · " + waiting.length], ["missing", "Не сдали · " + missing.length]]) {
      const b = btn(null, label);
      b.setAttribute("aria-pressed", SC.rvFilter === v ? "true" : "false");
      b.addEventListener("click", () => { SC.rvFilter = v; renderReview(true); });
      seg.append(b);
    }
    $("rvNudge").disabled = !missing.length || !S.canWrite;
    $("rvCopy").disabled = !missing.length;
    const rows = SC.rvFilter === "wait" ? waiting : SC.rvFilter === "missing" ? missing : all;
    const list = $("rvList");
    list.replaceChildren();
    if (!all.length) list.append(h("p", "p-intro", "Учеников пока нет: они появятся, когда напишут в чат или сдадут работу."));
    else if (!rows.length) list.append(h("p", "p-intro", SC.rvFilter === "wait" ? "Проверять нечего: всё сданное уже проверено." : "Сдали все."));''')
    rep('''  function openReview(id) { SC.rv = id; $("reviewBox").hidden = false; renderReview(true); }''',
        '''  function openReview(id, filter) { SC.rv = id; SC.rvFilter = filter || "all"; $("reviewBox").hidden = false; renderReview(true); }''')

    # ---------- the course settings: the gradebook for the team, progress for a student ----------
    rep('''      const t = btn("btn", "Задание ученикам");
      t.addEventListener("click", () => openTaskForm(""));''', '''      const t = btn("btn", "Задание ученикам");
      t.addEventListener("click", () => openTaskForm(""));
      const bk = btn("btn sec", "Журнал курса");
      bk.addEventListener("click", openBook);
      rows.push(bk);''')
    rep('''    } else rows.push(h("p", "set-note", "Задания — карточки в канале, сдаются кнопкой «Сдать». Вопросы — в #вопросы: ответит куратор или @claude по программе курса."));''',
        '''    } else {
      rows.push(h("p", "set-note", "Задания — карточки в канале, сдаются кнопкой «Сдать». Вопросы — в #вопросы: ответит куратор или @claude по программе курса."));
      if (S.nick) rows.push(progressEl());
    }''')
    # the team panel: a student's progress for the course team
    rep('''        if (schoolOn()) nm.append(" ", h("span", "chip role-chip", ROLES[roleOf(n)]));''',
        '''        if (schoolOn()) nm.append(" ", h("span", "chip role-chip", ROLES[roleOf(n)]));
        if (schoolOn() && iAmStaff() && !isStaff(n) && SC.tasks.size) { const pr = progressOf(n); li.append(h("span", "st", "Сдано " + pr.done + " из " + pr.total + " · проверено " + pr.ok + (pr.rework ? " · на доработке " + pr.rework : "") + (pr.late ? " · просрочено " + pr.late : ""))); }''')

    # ---------- wiring ----------
    rep('''    $("rvClose").addEventListener("click", closeReview);''', '''    $("rvClose").addEventListener("click", closeReview);
    $("rvNudge").addEventListener("click", () => { const t = SC.tasks.get(SC.rv); if (t) nudgeMissing(t); });
    $("rvCopy").addEventListener("click", () => { const t = SC.tasks.get(SC.rv); if (t) copyText(missingOf(t).join(", "), $("rvCopy"), "Скопировано"); });
    $("rvBook").addEventListener("click", () => { closeReview(); openBook(); });
    $("bookClose").addEventListener("click", () => { $("bookBox").hidden = true; });
    $("bookBox").addEventListener("click", (e) => { if (e.target === $("bookBox")) $("bookBox").hidden = true; });
    $("bookCsv").addEventListener("click", bookCsv);
    $("tkTpl").addEventListener("change", () => { const tp = TASK_TPL[Number($("tkTpl").value)]; if (!tp) return; $("tkName").value = tp.title; $("tkText").value = tp.text; $("tkCrit").value = tp.criteria; });
    for (const [i, tp] of TASK_TPL.entries()) { const o = h("option", null, tp.name); o.value = String(i); $("tkTpl").append(o); }
    setInterval(dueSoon, 600000);''')
    rep('''if (!$("reviewBox").hidden) closeReview(); else if''', '''if (!$("bookBox").hidden) $("bookBox").hidden = true; else if (!$("reviewBox").hidden) closeReview(); else if''')
    rep('''    $("tkErr").hidden = true;
    $("tkSave").textContent = t ? "Сохранить" : "Выложить";''', '''    $("tkErr").hidden = true;
    $("tkTpl").value = "";
    $("tkTpl").closest("label").hidden = !!t;
    $("tkSave").textContent = t ? "Сохранить" : "Выложить";''')
    rep('''  function syncSchool() {
    $("pickTask").hidden = !iAmStaff();''', '''  function syncSchool() {
    $("pickTask").hidden = !iAmStaff();
    setTimeout(dueSoon, 1500);''')

    # ---------- the code ----------
    rep('''  // ---------- the curator assistant ----------''', '''  // ---------- teacher tools ----------
  // Ready-made assignments for a course about working with Claude: a start the teacher edits, not a fixed set.
  const TASK_TPL = [
    { name: "Промпт под рабочую задачу", title: "Промпт для рабочей задачи", text: "Возьми задачу из своей работы, которую хочется отдать Claude. Напиши для неё промпт и проверь его на деле.\\n\\nСдай сам промпт и ответ Claude, который получился.", criteria: "Есть роль и контекст: кто пишет и для кого\\nЗадан формат ответа: длина, структура, тон\\nЕсть ограничения или пример\\nПриложен ответ Claude" },
    { name: "Выжимка документа", title: "Выжимка документа на 5 пунктов", text: "Загрузи в Claude длинный рабочий документ: договор, регламент или отчёт. Попроси выжимку на 5 пунктов и проверь её по оригиналу.\\n\\nСдай промпт, выжимку и одну неточность, которую нашёл сам.", criteria: "Выжимка ровно на 5 пунктов\\nПункты сверены с оригиналом\\nНайдена и описана хотя бы одна неточность\\nВ работе нет конфиденциальных данных" },
    { name: "Два промпта — один вопрос", title: "Два промпта — один вопрос", text: "Задай Claude один и тот же вопрос двумя промптами: коротким и подробным. Сравни ответы.\\n\\nСдай оба промпта, оба ответа и вывод в 3 предложениях: что изменилось и почему.", criteria: "Два разных промпта к одной задаче\\nОба ответа приложены\\nВывод объясняет разницу, а не пересказывает ответы" },
    { name: "Свой помощник в проекте", title: "Свой помощник в проекте Claude", text: "Создай в Claude проект с инструкцией под одну повторяющуюся задачу своей команды. Проверь его на трёх реальных запросах.\\n\\nСдай текст инструкции, три запроса и что пришлось поправить в инструкции после проверки.", criteria: "Инструкция описывает роль, задачу и формат\\nПроверено на трёх запросах\\nОписано, что поправлено после проверки" },
    { name: "Итоги недели", title: "Итоги недели", text: "Коротко ответь: что из этой недели ты уже используешь в работе, что не получилось и какой вопрос хочешь разобрать на созвоне.", criteria: "Есть пример из своей работы\\nНазвано, что не получилось\\nЕсть вопрос к созвону" },
  ];
  const remindChannel = (t) => (S.channels.has("s-ann") && !S.channels.get("s-ann").archived ? "s-ann" : t.ch);
  const missingOf = (t) => students().filter((n) => { const st = workOf(t, n).st; return st === "none" || st === "late"; });
  function lastReminder(t) {
    let at = 0;
    for (const m of collect().list) if (m.remind && m.reply === t.id && m.at > at) at = m.at;
    return at;
  }
  // one message for the whole course, in #объявления: the deadline and how many have handed in, never names
  function remindAll(t) {
    if (!iAmStaff() || !S.db || !S.canWrite) return;
    const c = taskCounts(t), ch = remindChannel(t);
    const text = "⏰ Напоминание: «" + t.title + "»" + (t.due ? " — сдать до " + fmtFull.format(t.due) : "") + ". Пока сдали " + c.done + " из " + c.total + ". Сдать — кнопкой «Сдать» на карточке задания в " + chLabel(t.ch) + ".";
    addItem(withCh({ id: rid(12), at: Date.now(), kind: "text", nick: S.nick, text, reply: t.id, remind: 1 }, ch));
    notice("Напоминание ушло в " + chLabel(ch) + ".");
  }
  // only those who have not handed in, by name, in the task's own channel: each gets an @ mention
  function nudgeMissing(t) {
    if (!iAmStaff() || !S.db || !S.canWrite) return;
    const left = missingOf(t);
    if (!left.length) { notice("Все уже сдали."); return; }
    const text = left.map((n) => "@" + n).join(" ") + ", напоминаю про «" + t.title + "»" + (t.due ? (t.due < Date.now() ? ": срок прошёл " + fmtFull.format(t.due) + ", но сдать ещё можно" : ": сдать до " + fmtFull.format(t.due)) : "") + ". Кнопка «Сдать» — на карточке задания.";
    addItem(withCh({ id: rid(12), at: Date.now(), kind: "text", nick: S.nick, text, reply: t.id, remind: 1 }, t.ch));
    notice("Напомнил: " + left.join(", ") + ".");
  }
  // a day before a deadline the team is offered one reminder, once per task on each device
  function dueSoon() {
    if (!iAmStaff() || !S.loaded || !S.canWrite) return;
    const now = Date.now();
    for (const t of SC.tasks.values()) {
      if (!t.due || t.due < now || t.due - now > DAY || ls.get("chat.dueAsk." + t.id)) continue;
      if (now - lastReminder(t) < 20 * 3600000) continue;
      ls.set("chat.dueAsk." + t.id, "1");
      const c = taskCounts(t);
      notice("Меньше суток до срока «" + t.title + "»: сдали " + c.done + " из " + c.total + ". Напомнить в " + chLabel(remindChannel(t)) + "?", true, { label: "Напомнить", fn: () => remindAll(t) });
      return;
    }
  }
  function progressOf(nick) {
    const r = { done: 0, ok: 0, rework: 0, late: 0, total: 0 };
    for (const t of SC.tasks.values()) {
      const st = workOf(t, nick).st;
      r.total++;
      if (st !== "none" && st !== "late") r.done++;
      if (st === "ok") r.ok++;
      if (st === "rework") r.rework++;
      if (st === "late") r.late++;
    }
    return r;
  }
  const sortedTasks = () => [...SC.tasks.values()].sort((a, b) => (a.due || a.at) - (b.due || b.at));
  // a student's own course at a glance; a tap leads to the card
  function progressEl() {
    const wrap = h("div", "set-row");
    const pr = progressOf(subNick());
    wrap.append(h("span", null, "Твой прогресс: сдано " + pr.done + " из " + pr.total + (pr.ok ? " · проверено " + pr.ok : "")));
    const ul = h("ul", "prog");
    for (const t of sortedTasks()) {
      const w = workOf(t, subNick());
      const b = btn(null, null, t.title);
      b.append(h("span", null, t.title), h("b", "st-chip " + w.st, ST_LABEL[w.st] + (w.st === "ok" && w.g.grade ? " · " + w.g.grade : "")));
      b.addEventListener("click", () => { closePanel(); if (t.ch !== S.ch) switchChannel(t.ch); S.pendingJump = t.id; render(); });
      const li = h("li");
      li.append(b);
      ul.append(li);
    }
    if (!SC.tasks.size) ul.append(h("li", "p-intro", "Заданий пока нет."));
    wrap.append(ul);
    return wrap;
  }
  // ---------- the course gradebook ----------
  const BOOK_MARK = { ok: "✓", rework: "↺", sub: "•", again: "•", none: "—", late: "✕" };
  function openBook() {
    if (!iAmStaff()) return;
    renderBook();
    $("bookBox").hidden = false;
  }
  function renderBook() {
    const tasks = sortedTasks(), st = students();
    let done = 0, cells = 0;
    const table = h("table", "book");
    const head = h("tr");
    head.append(h("th", null, "Ученик"));
    for (const t of tasks) { const th = h("th", null, t.title.length > 22 ? t.title.slice(0, 21) + "…" : t.title); th.title = t.title; if (t.due) th.append(h("span", "due", "до " + fmtShort.format(t.due).replace(",", ""))); head.append(th); }
    head.append(h("th", null, "Сдано"));
    const thead = h("thead");
    thead.append(head);
    const tbody = h("tbody");
    for (const n of st) {
      const tr = h("tr");
      tr.append(h("td", null, n));
      let mine = 0;
      for (const t of tasks) {
        const w = workOf(t, n), td = h("td");
        const b = btn(w.st, w.st === "ok" && w.g.grade ? w.g.grade : BOOK_MARK[w.st], n + ": " + ST_LABEL[w.st] + (w.g && w.g.grade ? ", оценка " + w.g.grade : ""));
        b.title = n + " · «" + t.title + "»: " + ST_LABEL[w.st];
        b.addEventListener("click", () => { $("bookBox").hidden = true; openReview(t.id, w.st === "none" || w.st === "late" ? "missing" : "all"); });
        td.append(b);
        tr.append(td);
        cells++;
        if (w.s) { mine++; done++; }
      }
      tr.append(h("td", "sum", mine + "/" + tasks.length));
      tbody.append(tr);
    }
    table.append(thead, tbody);
    $("bookWrap").replaceChildren(table);
    $("bookStat").textContent = st.length + " учеников · " + tasks.length + " заданий · сдано " + done + " из " + cells + " работ";
    $("bookCsv").hidden = !S.downloads;
  }
  async function bookCsv() {
    if (!S.downloads) { notice("Скачивание в этом окне недоступно."); return; }
    const tasks = sortedTasks(), q = (x) => '"' + String(x).replace(/"/g, '""') + '"';
    const lines = [["Ученик"].concat(tasks.map((t) => t.title), ["Сдано"]).map(q).join(";")];
    for (const n of students()) {
      let mine = 0;
      const row = [n];
      for (const t of tasks) { const w = workOf(t, n); if (w.s) mine++; row.push(w.st === "ok" && w.g.grade ? w.g.grade : ST_LABEL[w.st]); }
      row.push(mine + " из " + tasks.length);
      lines.push(row.map(q).join(";"));
    }
    const name = "Журнал — " + (SC.config ? SC.config.course : "курс").replace(/[\\\\/:*?"<>|]+/g, " ").slice(0, 60) + ".csv";
    try { await S.downloads.save({ filename: name, data: new Blob(["\\ufeff" + lines.join("\\r\\n")], { type: "text/csv" }) }); }
    catch (e) { if (!e || e.code !== "cancelled") notice("Не получилось скачать журнал."); }
  }

  // ---------- the curator assistant ----------''')
    # the gradebook and reviews follow the data
    rep('''        SC.tasks = m;
        render(); renderReview();''', '''        SC.tasks = m;
        render(); renderReview(); setTimeout(dueSoon, 1500);''')
    rep('''        SC.grades = m;
        gradeNews();
        render(); renderReview();''', '''        SC.grades = m;
        gradeNews();
        render(); renderReview(); if (!$("bookBox").hidden) renderBook();''')
    rep('''        SC.subs = m;
        render(); renderReview();''', '''        SC.subs = m;
        render(); renderReview(); if (!$("bookBox").hidden) renderBook();''')
    rep('''  const SC = { config: null, tasks: new Map(), grades: new Map(), subs: new Map(), memMode: "program", rv: "", rvDraft: new Map(), rvStale: false };''',
        '''  const SC = { config: null, tasks: new Map(), grades: new Map(), subs: new Map(), memMode: "program", rv: "", rvFilter: "all", rvDraft: new Map(), rvStale: false };''')
    # help
    rep('''Сам Claude ничего ученику не отправляет.\\n''', '''Сам Claude ничего ученику не отправляет.\\nНапоминания: «Напомнить» на карточке пишет в #объявления срок и сколько сдали, без имён. В «Работах» — «Не сдали» и «Напомнить не сдавшим»: сообщение с @упоминанием каждого в канале задания. За сутки до срока преподавателю предложат напомнить.\\nЖурнал курса: «Настройки» → «Курс» → «Журнал курса» — таблица ученики × задания, оттуда же CSV для Excel. Ученик видит там свой прогресс.\\nШаблоны: в форме задания можно начать с готового — промпт, выжимка документа, два промпта, свой помощник, итоги недели.\\n''')
    return s
