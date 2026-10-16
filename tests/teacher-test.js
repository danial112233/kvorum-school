// Teacher tools: templates, deadline reminders, «who has not handed in», the gradebook, progress.
const { webkit, devices } = require("playwright");
const ok = (name, cond, extra) => console.log((cond ? "PASS " : "FAIL ") + name + (extra !== undefined ? "  " + JSON.stringify(extra).slice(0, 260) : ""));
const T = "t1abcdefgh12";
(async () => {
  const b = await webkit.launch();
  const open = async (q, opts) => {
    const ctx = await b.newContext(opts || { viewport: { width: 1280, height: 860 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => { if (!/_blob\//.test(String(e))) errs.push(String(e)); });
    await p.goto("file://" + __dirname + "/school.html?" + q);
    await p.waitForTimeout(900);
    return { p, errs };
  };
  const go = (p, ch) => p.evaluate((c) => { const r = document.querySelector('.ch[data-ch="' + c + '"]'); r.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); r.dispatchEvent(new PointerEvent("pointerup", { bubbles: true })); r.click(); }, ch);
  const lastMsg = (p) => p.evaluate(() => { const w = window.__writes.filter(([k]) => k.startsWith("msgs/")).slice(-1)[0]; return w ? w[1].items.slice(-1)[0] : null; });

  {
    const { p, errs } = await open("school=1&nick=Анна");
    // templates
    await p.click("#attachBtn");
    await p.click("#pickTask");
    const opts = await p.evaluate(() => [...document.querySelectorAll("#tkTpl option")].map((o) => o.textContent));
    ok("the task form offers templates", opts.length === 6 && opts.includes("Выжимка документа"), opts);
    await p.selectOption("#tkTpl", { label: "Выжимка документа" });
    const f = await p.evaluate(() => ({ n: document.getElementById("tkName").value, t: document.getElementById("tkText").value, c: document.getElementById("tkCrit").value }));
    ok("a template fills title, task and criteria", f.n === "Выжимка документа на 5 пунктов" && /5 пунктов/.test(f.t) && f.c.split("\n").length === 4, f);
    await p.click("#tkCancel");
    // the card's reminder goes to #объявления without names
    await go(p, "s-homework");
    await p.waitForTimeout(300);
    const btns = await p.evaluate(() => [...document.querySelector(".task-foot").querySelectorAll("button")].map((x) => x.textContent));
    ok("the card has «Напомнить» for the team", btns.includes("Напомнить"), btns);
    await p.evaluate(() => [...document.querySelector(".task-foot").querySelectorAll("button")].find((x) => x.textContent === "Напомнить").click());
    await p.waitForTimeout(300);
    const r1 = await lastMsg(p);
    ok("the reminder is posted in #объявления with the count, no names", r1 && r1.ch === "s-ann" && r1.remind === 1 && r1.reply === T && /Пока сдали 2 из 4/.test(r1.text) && !/Лена|Тимур/.test(r1.text), r1);
    await go(p, "s-ann");
    await p.waitForTimeout(300);
    const chip = await p.evaluate(() => [...document.querySelectorAll(".sub-chip")].map((x) => x.textContent));
    ok("it shows «Напоминание о сроке»", chip.includes("Напоминание о сроке"), chip);
    // its quote leads to the task in another channel
    await p.evaluate(() => { const q = [...document.querySelectorAll(".quote")].find((x) => /Задание:/.test(x.textContent)); q.click(); });
    await p.waitForTimeout(600);
    const where = await p.evaluate(() => ({ ch: document.getElementById("chTitle").textContent, flash: !!document.querySelector(".task.flash") }));
    ok("the quote switches to #домашки and finds the card", where.ch === "#домашки", where);
    // review: filter and the nudge
    await p.click(".task-foot .btn-s.primary");
    await p.waitForTimeout(300);
    const seg = await p.evaluate(() => [...document.querySelectorAll("#rvFilter button")].map((x) => x.textContent));
    ok("the review has filters with counts", seg.join("|") === "Все · 4|Ждут проверки · 1|Не сдали · 2", seg);
    await p.evaluate(() => [...document.querySelectorAll("#rvFilter button")][2].click());
    await p.waitForTimeout(200);
    const miss = await p.evaluate(() => [...document.querySelectorAll(".rv .rv-head b")].map((x) => x.textContent));
    ok("«Не сдали» lists exactly those two", miss.join(",") === "Лена,Тимур", miss);
    await p.click("#rvNudge");
    await p.waitForTimeout(300);
    const r2 = await lastMsg(p);
    ok("«Напомнить не сдавшим» mentions each in the task channel", r2 && r2.ch === "s-homework" && /^@Лена @Тимур, напоминаю про «Промпт для письма клиенту»/.test(r2.text) && r2.remind === 1, r2);
    // the gradebook
    await p.click("#rvBook");
    await p.waitForTimeout(300);
    const book = await p.evaluate(() => ({ open: !document.getElementById("bookBox").hidden, stat: document.getElementById("bookStat").textContent, rows: [...document.querySelectorAll("#bookWrap tbody tr")].map((tr) => [...tr.children].map((td) => td.textContent).join("|")) }));
    ok("the gradebook shows students × tasks", book.open && book.rows.length === 4 && book.rows.includes("Маша|5|1/1") && book.rows.includes("Дима|•|1/1") && book.rows.includes("Лена|—|0/1"), book);
    await p.click("#bookCsv");
    await p.waitForTimeout(300);
    const csv = await p.evaluate(async () => { const s = window.__saved; return s ? { name: s.filename, text: await s.data.text() } : null; });
    ok("CSV downloads with a header and a row per student", csv && /^Журнал — Claude для работы, поток 1\.csv$/.test(csv.name) && csv.text.split("\r\n").length === 5 && /"Маша";"5";"1 из 1"/.test(csv.text), csv);
    await p.evaluate(() => [...document.querySelectorAll("#bookWrap tbody tr")].find((tr) => /Лена/.test(tr.textContent)).querySelector("button").click());
    await p.waitForTimeout(300);
    const back = await p.evaluate(() => ({ review: !document.getElementById("reviewBox").hidden, filt: [...document.querySelectorAll("#rvFilter button")].find((x) => x.getAttribute("aria-pressed") === "true").textContent }));
    ok("a cell opens the review on that filter", back.review && /^Не сдали/.test(back.filt), back);
    await p.click("#rvClose");
    // the team panel shows each student's progress
    await p.click("#teamBtn");
    await p.waitForTimeout(300);
    const team = await p.evaluate(() => [...document.querySelectorAll("#teamList .person")].map((li) => li.querySelector("b").textContent.split(" ")[0] + ":" + [...li.querySelectorAll(".st")].map((x) => x.textContent).join("/")));
    ok("the team panel shows progress for students", team.some((t) => /^Маша:.*Сдано 1 из 1 · проверено 1/.test(t)) && team.some((t) => /^Лена:.*Сдано 0 из 1/.test(t)) && !team.some((t) => /^Анна:.*Сдано/.test(t)), team);
    ok("no page errors (teacher tools)", !errs.length, errs);
  }
  {
    // the deadline nudge a day before
    const { p, errs } = await open("school=1&nick=Олег");
    await p.evaluate(() => { const t = window.__stub.store.tasks.t1abcdefgh12; t.due = Date.now() + 5 * 3600000; window.__stub.fire("tasks"); });
    await p.waitForTimeout(2500);
    const n = await p.evaluate(() => ({ t: document.getElementById("noticeText").textContent, a: document.getElementById("noticeAct").textContent }));
    ok("a day before the deadline the team is offered a reminder", /Меньше суток до срока «Промпт для письма клиенту»/.test(n.t) && n.a === "Напомнить", n);
    ok("no page errors (due soon)", !errs.length, errs);
  }
  {
    // a student's own progress
    const { p, errs } = await open("school=1&nick=Маша");
    await p.click("#setBtn");
    await p.waitForTimeout(300);
    const pr = await p.evaluate(() => { const g = [...document.querySelectorAll("#setPane .set-group")].find((x) => /Курс/.test(x.querySelector("h3").textContent)); return { head: (g.querySelector(".set-row > span") || {}).textContent, items: [...g.querySelectorAll(".prog button")].map((b) => b.textContent) }; });
    ok("a student sees their progress", /Твой прогресс: сдано 1 из 1 · проверено 1/.test(pr.head) && pr.items.length === 1 && /проверено · 5/.test(pr.items[0]), pr);
    ok("a student has no gradebook", await p.evaluate(() => ![...document.querySelectorAll("#setPane button")].some((b) => b.textContent === "Журнал курса")));
    ok("no page errors (student progress)", !errs.length, errs);
  }
  {
    // the gradebook on a phone scrolls inside itself
    const { p, errs } = await open("school=1&nick=Анна", { ...devices["iPhone 13"] });
    await p.evaluate(() => { for (let i = 0; i < 5; i++) window.__stub.store.tasks["t2abcdefgh1" + i] = { title: "Задание номер " + (i + 2) + " с длинным названием", text: "x", criteria: "", due: Date.now() + (i + 2) * 864e5, ch: "s-homework", by: "Анна", at: Date.now() - 1e5 }; window.__stub.fire("tasks"); });
    await p.waitForTimeout(300);
    await p.click("#setBtn");
    await p.waitForTimeout(300);
    await p.evaluate(() => [...document.querySelectorAll("#setPane button")].find((b) => b.textContent === "Журнал курса").click());
    await p.waitForTimeout(400);
    const fit = await p.evaluate(() => { const w = document.getElementById("bookWrap"); return { sw: document.documentElement.scrollWidth, w: innerWidth, inner: w.scrollWidth > w.clientWidth }; });
    ok("on a phone the gradebook scrolls inside, the page does not", fit.sw <= fit.w && fit.inner, fit);
    await p.screenshot({ path: __dirname + "/book-phone.png" });
    ok("no page errors (phone)", !errs.length, errs);
  }
  await b.close();
})();
