# -*- coding: utf-8 -*-
import json, time, datetime, os
def fnv(s):
    x = 0x811c9dc5
    for ch in s:
        x ^= ord(ch); x = (x * 0x01000193) & 0xffffffff
    return x
key = lambda n: n.strip().lower()
pid = lambda n: "p-%08x" % fnv(key(n))
now = int(time.time() * 1000); H = 3600000; D = 24 * H
T = "tdemoweek1prompt"
sub = lambda n: T + "-%08x" % fnv(key(n))
local = datetime.datetime.now()
due = local.replace(hour=23, minute=59, second=0, microsecond=0) + datetime.timedelta(days=3)
due_ms = int(due.timestamp() * 1000)
day = datetime.datetime.utcfromtimestamp(now / 1000).strftime("%Y-%m-%d")
W = []
def put(col, doc, data): W.append({"op": "set", "collection": col, "doc_id": doc, "data": data})
put("school", "config", {"course": "Claude для работы, поток 1 (демо)", "by": "Анна", "at": now - 3 * D})
people = [("Анна", "teacher", "Ведёт курс: промпты, документы, проекты. Демо-участник пробной версии."),
          ("Олег", "curator", "Куратор потока: проверяет домашки, отвечает в #вопросы по будням 10–19. Демо-участник."),
          ("Маша", "student", "Демо-ученица: менеджер проектов."), ("Дима", "student", "Демо-ученик: продажи."),
          ("Лена", "student", "Демо-ученица: HR."), ("Тимур", "student", "Демо-ученик: маркетинг.")]
for i, (n, r, c) in enumerate(people):
    put("people", pid(n), {"nick": n, "face": (fnv(key(n)) % 997), "card": c, "updatedAt": now - 3 * D, "role": r})
chans = [("s-ann", "объявления", "channel", "Новости курса. Пишут преподаватели и кураторы.", True),
         ("s-questions", "вопросы", "channel", "Вопросы по курсу: ответит куратор или @claude по программе.", False),
         ("s-homework", "домашки", "channel", "Задания и сдача работ.", False),
         ("s-flood", "флуд", "channel", "Обо всём.", False)]
for cid, name, kind, topic, ann in chans:
    d = {"name": name, "kind": kind, "topic": topic, "members": [], "by": "Анна", "at": now - 3 * D, "archived": False}
    if ann: d["ann"] = True
    put("channels", cid, d)
import secrets, string
room = "nashchat-" + "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(20))
put("channels", "s-call", {"name": "Созвон", "kind": "voice", "topic": "", "members": [], "by": "Анна", "at": now - 3 * D, "archived": False, "room": room})
prog = ["Неделя 1 — как ставить задачу Claude: роль, контекст, формат ответа, примеры. Домашка: промпт для письма клиенту.",
        "Неделя 2 — работа с документами: загрузка файлов, выжимки, сравнение версий. Домашка: выжимка договора на 5 пунктов.",
        "Неделя 3 — проекты и инструкции: свой помощник под задачу команды. Домашка: инструкция для проекта.",
        "Сроки: домашку сдаём до воскресенья 23:59. Позже можно, но проверка в порядке очереди. Перенос срока решает куратор.",
        "Как сдавать: кнопка «Сдать» на карточке задания в #домашки — текстом, файлом, голосовым или кружком.",
        "Созвоны: по вторникам в 19:00 по Москве в голосовом канале «Созвон». Записи выкладываем в #объявления."]
for i, t in enumerate(prog):
    put("brain", "prog%02d" % (i + 1), {"text": t, "by": "Анна", "at": now - 3 * D + i * 1000, "src": "program"})
put("brain", "demonote01", {"text": "Это пробная школьная версия с демо-данными: люди, работы и оценки придуманы для проверки.", "by": "Анна", "at": now - 3 * D + 9000, "src": "manual"})
put("tasks", T, {"title": "Промпт для письма клиенту", "text": "Напиши промпт, по которому Claude готовит письмо клиенту о переносе срока проекта на неделю.\n\nСдай сам промпт и один пример письма, которое получилось.", "criteria": "Есть роль и контекст: кто пишет и кому\nЗадан формат: длина, тон, структура\nЕсть ограничения или пример\nПриложен пример готового письма", "due": due_ms, "ch": "s-homework", "by": "Анна", "at": now - 2 * D})
masha_at, dima_at = now - 6 * H, now - 90 * 60000
items = [
  {"id": "demoann00001", "at": now - 2 * D - H, "kind": "text", "nick": "Анна", "text": "Добро пожаловать на поток! Первое задание уже в #домашки, срок — воскресенье 23:59. Вопросы — в #вопросы, там же отвечает @claude по программе курса.", "ch": "s-ann"},
  {"id": "demoann00002", "at": now - 2 * D - H + 60000, "kind": "text", "nick": "Олег", "text": "Я куратор потока, проверяю домашки. Если @claude не знает ответа, он позовёт меня.", "ch": "s-ann"},
  {"id": "demoflood001", "at": now - D, "kind": "text", "nick": "Тимур", "text": "Всем привет! Я Тимур, маркетолог. Хочу научиться отдавать Claude рутину с отчётами.", "ch": "s-flood"},
  {"id": "demosubmasha", "at": masha_at, "kind": "text", "nick": "Маша", "text": "**Промпт:** Ты — менеджер проекта в веб-студии. Напиши клиенту письмо о переносе срока сдачи сайта на неделю. Тон вежливый и спокойный, 5–7 предложений: причина, новый план по дням, что клиент получит раньше. Без канцелярита.\n\n**Пример письма:** Добрый день, Ирина! Мы переносим запуск сайта на 24 октября...", "ch": "s-homework", "reply": T, "sub": 1},
  {"id": "demosubdima1", "at": dima_at, "kind": "text", "nick": "Дима", "text": "Напиши письмо клиенту что срок переносится на неделю.", "ch": "s-homework", "reply": T, "sub": 1},
  {"id": "demoqlena001", "at": now - 40 * 60000, "kind": "text", "nick": "Лена", "text": "А можно сдать задание голосовым? И снизят ли за это оценку?", "ch": "s-questions"},
]
put("msgs", day.replace("-", "") + "-seed-demo", {"day": day, "writer": "seed", "items": items})
put("subs", sub("Маша"), {"task": T, "nick": "Маша", "at": masha_at, "msg": "demosubmasha", "n": 1})
put("subs", sub("Дима"), {"task": T, "nick": "Дима", "at": dima_at, "msg": "demosubdima1", "n": 1})
put("grades", sub("Маша"), {"task": T, "student": "Маша", "status": "ok", "grade": "5", "comment": "Есть роль, тон, длина и структура письма — всё по критериям. Пример письма тоже на месте. Отлично!", "by": "Олег", "at": masha_at + 2 * H})
print(len(W), "writes")
json.dump(W, open("writes.json", "w", encoding="utf-8"), ensure_ascii=False)
