(function(){
  var q = new URLSearchParams(location.search);
  if (!q.has("school")) return;
  var st = window.__stub.store, now = Date.now(), H = 3600000, D = 24 * H, day = new Date(now).toISOString().slice(0, 10);
  ["msgs", "people", "channels", "brain", "school", "tasks", "subs", "grades"].forEach(function(k){ st[k] = {}; });
  var nicks = [["Анна", "teacher"], ["Олег", "curator"], ["Маша", "student"], ["Дима", "student"], ["Лена", "student"], ["Тимур", "student"]];
  function fnv(str) { var x = 0x811c9dc5; for (var ch of str) { x ^= ch.codePointAt(0); x = Math.imul(x, 0x01000193) >>> 0; } return x >>> 0; }
  var pid = function(n){ return "p-" + fnv(n.trim().toLowerCase()).toString(16).padStart(8, "0"); };
  nicks.forEach(function(x, i){ st.people[pid(x[0])] = { nick: x[0], face: i + 2, card: "", updatedAt: now - D, role: x[1] }; });
  if (q.get("school") === "0") return;
  st.school.config = { course: "Claude для работы, поток 1", by: "Анна", at: now - 3 * D };
  st.channels["s-ann"] = { name: "объявления", kind: "channel", ann: true, topic: "Новости курса.", members: [], by: "Анна", at: now - 3 * D, archived: false };
  st.channels["s-questions"] = { name: "вопросы", kind: "channel", topic: "Вопросы по курсу.", members: [], by: "Анна", at: now - 3 * D, archived: false };
  st.channels["s-homework"] = { name: "домашки", kind: "channel", topic: "Задания и сдача работ.", members: [], by: "Анна", at: now - 3 * D, archived: false };
  st.channels["s-flood"] = { name: "флуд", kind: "channel", topic: "Обо всём.", members: [], by: "Анна", at: now - 3 * D, archived: false };
  st.channels["s-call"] = { name: "Созвон", kind: "voice", topic: "", members: [], by: "Анна", at: now - 3 * D, archived: false, room: "nashchat-abcdefghijklmnopqrst" };
  st.brain.p1 = { text: "Неделя 1: как ставить задачу Claude — роль, контекст, формат ответа, примеры. Домашка: промпт для письма клиенту.", by: "Анна", at: now - 3 * D, src: "program" };
  st.brain.p2 = { text: "Сроки: домашку сдаём до воскресенья 23:59. Позже можно, но проверка — в порядке очереди.", by: "Анна", at: now - 3 * D + 1000, src: "program" };
  st.brain.g1 = { text: "Занятия по вторникам в 19:00 по Москве.", by: "Анна", at: now - 2 * D, src: "manual" };
  st.tasks.t1abcdefgh12 = { title: "Промпт для письма клиенту", text: "Напиши промпт, по которому Claude готовит письмо клиенту о переносе срока. Сдай сам промпт и один пример ответа.", criteria: "Есть роль и контекст\nЗадан формат ответа\nЕсть пример или ограничения", due: now + 3 * D, ch: "s-homework", by: "Анна", at: now - 2 * D };
  st.msgs[day.replace(/-/g, "") + "-seed"] = { day: day, writer: "seed", items: [
    { id: "aaaaaaaaaan1", at: now - 2 * D - H, kind: "text", nick: "Анна", text: "Добро пожаловать на поток! Первое задание уже в #домашки.", ch: "s-ann" },
    { id: "aaaaaaaaams1", at: now - 5 * H, kind: "text", nick: "Маша", text: "**Промпт:** Ты — менеджер проекта. Напиши клиенту письмо о переносе срока на неделю: вежливо, 5–7 предложений, с новым планом.", ch: "s-homework", reply: "t1abcdefgh12", sub: 1 },
    { id: "aaaaaaaadm1", at: now - 2 * H, kind: "text", nick: "Дима", text: "Напиши письмо клиенту что срок переносится.", ch: "s-homework", reply: "t1abcdefgh12", sub: 1 },
    { id: "aaaaaaaaln1", at: now - H, kind: "text", nick: "Лена", text: "А можно сдать задание голосовым?", ch: "s-questions" }
  ] };
  st.subs["t1abcdefgh12-masha"] = { task: "t1abcdefgh12", nick: "Маша", at: now - 5 * H, msg: "aaaaaaaams1", n: 1 };
  st.subs["t1abcdefgh12-dima"] = { task: "t1abcdefgh12", nick: "Дима", at: now - 2 * H, msg: "aaaaaaaadm1", n: 1 };
  st.grades["t1abcdefgh12-masha"] = { task: "t1abcdefgh12", student: "Маша", status: "ok", grade: "5", comment: "Есть роль, формат и ограничения — отлично.", by: "Анна", at: now - 3 * H };
})();
