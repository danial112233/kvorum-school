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
    return { p, errs, ctx };
  };
  const go = (p, ch) => p.evaluate((c) => { const r = document.querySelector('.ch[data-ch="' + c + '"]') || [...document.querySelectorAll(".ch")].find((x) => x.dataset.id === c); if (r) { r.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); r.dispatchEvent(new PointerEvent("pointerup", { bubbles: true })); r.click(); } return !!r; }, ch);
  const writes = (p, prefix) => p.evaluate((x) => window.__writes.filter(([k]) => k.startsWith(x)), prefix);
  const sideIds = (p) => p.evaluate(() => [...document.querySelectorAll(".ch")].map((x) => x.dataset.ch || x.dataset.id || x.dataset.voice || ""));

  // ---------- the teacher ----------
  {
    const { p, errs } = await open("school=1&nick=Анна");
    const ids = await sideIds(p);
    ok("the cohort channels are in the list", ["s-ann", "s-questions", "s-homework", "s-flood"].every((x) => ids.includes(x)), ids);
    const mega = await p.evaluate(() => { const r = [...document.querySelectorAll(".ch")].find((x) => /объявления/.test(x.textContent)); return r ? !!r.querySelector(".hash svg") && !/#/.test(r.querySelector(".hash").textContent) : null; });
    ok("#объявления has a megaphone instead of #", mega === true, mega);
    await go(p, "s-homework");
    await p.waitForTimeout(400);
    const card = await p.evaluate(() => { const c = document.querySelector(".task-card"); if (!c) return null; return { title: c.querySelector("h3").textContent, due: (c.querySelector(".task-due") || {}).textContent, crit: (c.querySelector(".task-crit summary") || {}).textContent, stat: c.querySelector(".task-stat").textContent, btns: [...c.querySelectorAll(".task-foot button")].map((x) => x.textContent), mine: !!c.querySelector(".task-mine") }; });
    ok("the task card shows title, deadline and criteria", card && card.title === "Промпт для письма клиенту" && /Сдать до/.test(card.due) && /Критерии оценки · 3/.test(card.crit), card);
    ok("the teacher sees counts and «Работы»", card && card.stat === "Сдали 2 из 4 · проверено 1" && card.btns[0] === "Работы · 2" && !card.mine, card);
    const subChip = await p.evaluate(() => [...document.querySelectorAll(".sub-chip")].length);
    ok("hand-ins carry «Сдаёт задание»", subChip === 2, subChip);
    await p.click(".task-foot .btn-s.primary");
    await p.waitForTimeout(300);
    const rv = await p.evaluate(() => ({ open: !document.getElementById("reviewBox").hidden, stat: document.getElementById("rvStat").textContent, rows: [...document.querySelectorAll(".rv")].map((r) => r.querySelector(".rv-head b").textContent + ":" + r.querySelector(".st-chip").textContent) }));
    const md = await p.evaluate(() => { const r = [...document.querySelectorAll(".rv")].find((x) => /Маша/.test(x.querySelector(".rv-head b").textContent)); const box = r && r.querySelector(".rv-sub"); return box ? { strong: !!box.querySelector(".md strong, .md b"), raw: /\*\*/.test(box.textContent) } : null; });
    ok("a hand-in reads as markdown in the review", md && md.strong && !md.raw, md);
    ok("review lists students, waiting work first", rv.open && rv.rows[0] === "Дима:сдано, ждёт проверки" && rv.rows[1] === "Маша:проверено · 5" && rv.rows.length === 4, rv);
    // Claude drafts a review; nothing is written until the teacher presses a button
    await p.evaluate(() => { window.__sampleReply = '{"verdict":"rework","grade":"3","feedback":"Нет роли и формата ответа. Добавь, кто пишет письмо и в каком виде нужен ответ."}'; });
    const g0 = (await writes(p, "grades/")).length;
    await p.click(".rv >> nth=0 >> text=Проверить ИИ");
    await p.waitForTimeout(800);
    const dr = await p.evaluate(() => { const r = document.querySelector(".rv"); return { grade: r.querySelector(".rv-grade").value, comment: r.querySelector("textarea").value, note: r.querySelector(".rv-ai").textContent }; });
    const prompt = await p.evaluate(() => window.__prompts.slice(-1)[0] || "");
    ok("AI review fills a draft", dr.grade === "3" && /Нет роли/.test(dr.comment) && /вернуть на доработку/.test(dr.note), dr);
    ok("the review prompt has task, criteria and the work", /Промпт для письма клиенту/.test(prompt) && /1\. Есть роль и контекст/.test(prompt) && /Напиши письмо клиенту что срок переносится/.test(prompt) && /<работа ученика Дима>/.test(prompt), prompt.slice(0, 120));
    ok("nothing saved before the teacher decides", (await writes(p, "grades/")).length === g0);
    await p.fill(".rv >> nth=0 >> textarea", "Нет роли и формата. Добавь их и сдай ещё раз.");
    await p.click(".rv >> nth=0 >> text=На доработку");
    await p.waitForTimeout(400);
    const gw = (await writes(p, "grades/")).slice(-1)[0];
    ok("«На доработку» writes the grade doc", gw && gw[1].status === "rework" && gw[1].student === "Дима" && gw[1].grade === "3" && /Добавь их/.test(gw[1].comment) && gw[1].by === "Анна", gw);
    const rows2 = await p.evaluate(() => [...document.querySelectorAll(".rv")].map((r) => r.querySelector(".st-chip").textContent));
    ok("the row shows «на доработке»", rows2.includes("на доработке"), rows2);
    await p.click("#rvClose");
    // a new task from the attachment menu
    const menu = await p.evaluate(() => !document.getElementById("pickTask").hidden);
    ok("the teacher has «Задание ученикам»", menu);
    await p.click("#attachBtn");
    await p.click("#pickTask");
    await p.fill("#tkName", "Сравнить два ответа");
    await p.fill("#tkText", "Задай Claude один вопрос двумя способами и сравни ответы.");
    await p.fill("#tkCrit", "Два варианта промпта\nВывод в 3 предложениях");
    await p.click("#tkSave");
    await p.waitForTimeout(400);
    const tw = (await writes(p, "tasks/")).slice(-1)[0];
    ok("the new task is saved", tw && /^tasks\/t[a-z0-9]{12}$/.test(tw[0]) && tw[1].title === "Сравнить два ответа" && tw[1].ch === "s-homework" && tw[1].due > Date.now() + 6 * 864e5, tw);
    const cards = await p.evaluate(() => [...document.querySelectorAll(".task-card h3")].map((x) => x.textContent));
    ok("and its card appears in #домашки", cards.includes("Сравнить два ответа"), cards);
    // the course team writes in #объявления, with a role chip
    await go(p, "s-ann");
    await p.waitForTimeout(300);
    const ann = await p.evaluate(() => ({ dis: document.getElementById("text").disabled }));
    ok("the teacher can write in #объявления", !ann.dis, ann);
    // roles from the team panel
    await p.click("#teamBtn");
    await p.waitForTimeout(300);
    const team = await p.evaluate(() => [...document.querySelectorAll("#teamList .person")].map((li) => li.querySelector("b").textContent));
    ok("the team panel shows roles", team.some((t) => /Маша.*Ученик/.test(t)) && team.some((t) => /Олег.*Куратор/.test(t)), team);
    await p.evaluate(() => { const li = [...document.querySelectorAll("#teamList .person")].find((x) => /Маша/.test(x.querySelector("b").textContent)); [...li.querySelectorAll("button")].find((b) => b.textContent === "Сделать куратором").click(); });
    await p.waitForTimeout(300);
    const role = await p.evaluate(() => Object.values(window.__stub.store.people).find((x) => x.nick === "Маша").role);
    ok("«Сделать куратором» updates people", role === "curator", role);
    ok("no page errors (teacher)", !errs.length, errs);
  }

  // ---------- a student ----------
  {
    const { p, errs } = await open("school=1&nick=Лена");
    ok("a student has no «Задание ученикам»", await p.evaluate(() => document.getElementById("pickTask").hidden));
    await go(p, "s-ann");
    await p.waitForTimeout(300);
    const lock = await p.evaluate(() => ({ dis: document.getElementById("text").disabled, ph: document.getElementById("text").placeholder }));
    ok("#объявления is closed to students", lock.dis && /пишут преподаватели/.test(lock.ph), lock);
    const chips = await p.evaluate(() => [...document.querySelectorAll(".chip.role-chip")].map((x) => x.textContent));
    ok("the teacher's post carries «преподаватель»", chips.includes("преподаватель"), chips);
    await go(p, "s-homework");
    await p.waitForTimeout(300);
    const mine = await p.evaluate(() => ({ t: document.querySelector(".task-mine").textContent, b: document.querySelector(".task-foot .btn-s").textContent }));
    ok("the student sees «не сдано» and «Сдать»", /не сдано/.test(mine.t) && mine.b === "Сдать", mine);
    await p.click(".task-foot .btn-s.primary");
    const bar = await p.evaluate(() => ({ who: document.getElementById("replyWho").textContent, snip: document.getElementById("replySnip").textContent, ph: document.getElementById("text").placeholder }));
    ok("«Сдать» opens a hand-in bar", bar.who === "Сдаёшь задание" && bar.snip === "Промпт для письма клиенту" && /Ответ к заданию/.test(bar.ph), bar);
    await p.fill("#text", "Ты — аккаунт-менеджер. Сообщи клиенту о переносе: 3 абзаца, новый план и извинение.");
    await p.press("#text", "Enter");
    await p.waitForTimeout(500);
    const w = await p.evaluate(() => { const m = window.__writes.filter(([k]) => k.startsWith("msgs/")).slice(-1)[0]; const it = m && m[1].items.slice(-1)[0]; return { it, sub: window.__writes.filter(([k]) => k.startsWith("subs/")).slice(-1)[0] }; });
    ok("the hand-in is a reply marked sub", w.it && w.it.reply === T && w.it.sub === 1 && w.it.ch === "s-homework", w.it);
    ok("and it is noted in subs", w.sub && w.sub[1].task === T && w.sub[1].nick === "Лена" && w.sub[1].msg === w.it.id, w.sub);
    const after = await p.evaluate(() => ({ t: document.querySelector(".task-mine").textContent, stat: document.querySelector(".task-stat").textContent, bar: document.getElementById("replyBar").hidden }));
    ok("the card says «ждёт проверки», 3 of 4", /ждёт проверки/.test(after.t) && /Сдали 3 из 4/.test(after.stat) && after.bar, after);
    // the curator assistant
    await go(p, "s-questions");
    await p.evaluate(() => { window.__sampleReply = "Голосовым можно, если в нём есть сам промпт. Про оценку за формат решит куратор.\n[[нужен куратор]]"; });
    await p.fill("#text", "@claude можно сдать голосовым? это повлияет на оценку?");
    await p.press("#text", "Enter");
    await p.waitForTimeout(900);
    const cl = await p.evaluate(() => { const items = []; for (const d of Object.values(window.__stub.store.msgs)) for (const it of d.items) if (it.kind === "claude") items.push(it); return items.slice(-1)[0]; });
    const pr = await p.evaluate(() => window.__prompts.slice(-1)[0] || "");
    ok("Claude answers as the curator assistant from the programme", /ассистент куратора онлайн-курса «Claude для работы, поток 1»/.test(pr) && /<программа курса>[\s\S]*Неделя 1/.test(pr) && /Промпт для письма клиенту/.test(pr), pr.slice(0, 140));
    ok("the marker becomes esc, not text", cl && cl.esc === 1 && !/\[\[/.test(cl.text) && /куратор/.test(cl.text), cl);
    const chip = await p.evaluate(() => [...document.querySelectorAll(".esc-chip")].map((x) => x.textContent));
    ok("the answer shows «Нужен куратор»", chip.includes("Нужен куратор"), chip);
    ok("no page errors (student)", !errs.length, errs);
  }
  {
    // a reviewed student sees the grade and the comment
    const { p } = await open("school=1&nick=Маша");
    await go(p, "s-homework");
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => ({ cls: document.querySelector(".task-mine").className, t: document.querySelector(".task-mine").textContent, b: document.querySelector(".task-foot .btn-s").textContent }));
    ok("the student sees «проверено · 5» and the comment", /ok/.test(t.cls) && /проверено · 5/.test(t.t) && /отлично/.test(t.t) && t.b === "Сдать заново", t);
  }

  // ---------- an empty course: one tap ----------
  {
    const { p, errs } = await open("school=0&nick=Сергей");
    const hint = await p.evaluate(() => ({ t: document.getElementById("noticeText").textContent, a: document.getElementById("noticeAct").textContent }));
    ok("an empty chat offers to set the course up", /Кворум · Курс/.test(hint.t) && hint.a === "Настроить", hint);
    await p.click("#noticeAct");
    const boxes = await p.evaluate(() => [...document.querySelectorAll("#crList input")].map((x) => x.checked && !x.disabled));
    ok("the template lists 5 channels, all ticked", boxes.length === 5 && boxes.every(Boolean), boxes);
    await p.fill("#crName", "Нейросети для маркетологов");
    await p.click("#crSave");
    await p.waitForTimeout(600);
    const ws = await p.evaluate(() => window.__writes.map(([k, d]) => k + (d.ann ? "!" : "") + (d.room ? "~" : "")));
    ok("config, 5 channels (#объявления locked, a voice room) written", ws.includes("school/config") && ["channels/s-ann!", "channels/s-questions", "channels/s-homework", "channels/s-flood", "channels/s-call~"].every((x) => ws.includes(x)), ws);
    const me = await p.evaluate(() => Object.values(window.__stub.store.people).find((x) => x.nick === "Сергей"));
    ok("the one who set it up is a teacher", me && me.role === "teacher", me);
    // project groups
    await p.click("#setBtn");
    await p.waitForTimeout(300);
    await p.evaluate(() => [...document.querySelectorAll("#setPane .seg button")].find((b) => b.textContent === "по 2").click());
    await p.waitForTimeout(500);
    const gr = await p.evaluate(() => window.__writes.filter(([k]) => k.startsWith("channels/s-proj-")).map(([k, d]) => k + ":" + d.members.join(",")));
    ok("project groups of 2 with the course team inside", gr.length === 2 && gr.every((x) => /сергей/.test(x) && /анна/.test(x)), gr);
    ok("no page errors (setup)", !errs.length, errs);
  }

  // ---------- a guest student hands in through a member's page ----------
  {
    const G = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
    const errs = []; G.on("pageerror", (e) => errs.push(String(e)));
    await G.goto("file://" + __dirname + "/school.html?school=1&nick=Вася&guest=1&ro=1&peer=pguest01&by=u_vasya");
    await G.waitForTimeout(900);
    await go(G, "s-homework");
    await G.waitForTimeout(300);
    await G.click(".task-foot .btn-s.primary");
    await G.fill("#text", "Мой промпт: ты менеджер, пиши письмо о переносе вежливо и коротко.");
    await G.press("#text", "Enter");
    await G.waitForTimeout(300);
    const ob = await G.evaluate(() => (window.__presence.outbox || [])[0]);
    ok("a guest's hand-in waits in the outbox with sub", ob && ob.reply === T && ob.sub === 1, ob);
    const M = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
    M.on("pageerror", (e) => errs.push("M " + e));
    await M.goto("file://" + __dirname + "/school.html?school=1&nick=Анна&peer=pmember1&by=u_shared");
    await M.waitForTimeout(900);
    await M.evaluate((o) => window.__stub.setPeers([{ kind: "viewer", guest: true, isMe: false, sameTab: false, by: "u_vasya", peer: "pguest01", presence: { nick: "Вася", outbox: [o] }, updatedAt: Date.now() }]), ob);
    await M.waitForTimeout(600);
    const rel = await M.evaluate(() => { let it = null; for (const d of Object.values(window.__stub.store.msgs)) for (const x of d.items) if (x.via === "guest") it = x; const s = window.__writes.filter(([k]) => k.startsWith("subs/")).slice(-1)[0]; return { it, s }; });
    ok("the member's page carries it in as a hand-in", rel.it && rel.it.sub === 1 && rel.it.reply === T && rel.it.nick === "Вася (гость)", rel.it);
    ok("and notes it in subs for the guest", rel.s && rel.s[1].nick === "Вася (гость)" && rel.s[1].task === T, rel.s);
    ok("no page errors (guest)", !errs.length, errs);
  }

  // ---------- phone ----------
  {
    const { p, errs } = await open("school=1&nick=Анна", { ...devices["iPhone 13"] });
    await p.evaluate(() => document.getElementById("chBtn").click());
    await p.waitForTimeout(300);
    await p.evaluate(() => { const r = [...document.querySelectorAll(".ch")].find((x) => /домашки/.test(x.textContent)); r.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); r.dispatchEvent(new PointerEvent("pointerup", { bubbles: true })); r.click(); });
    await p.waitForTimeout(400);
    const fit = await p.evaluate(() => { const c = document.querySelector(".task-card").getBoundingClientRect(); return { r: c.right, w: innerWidth, sw: document.documentElement.scrollWidth }; });
    ok("the task card fits the phone", fit.r <= fit.w && fit.sw <= fit.w, fit);
    await p.screenshot({ path: __dirname + "/school-task-phone.png" });
    await p.evaluate(() => document.querySelector(".task-foot .btn-s.primary").click());
    await p.waitForTimeout(300);
    const rv = await p.evaluate(() => { const c = document.querySelector("#reviewBox .card").getBoundingClientRect(); return { l: c.left, r: c.right, w: innerWidth, sw: document.documentElement.scrollWidth }; });
    ok("the review sheet fits the phone", rv.l >= 0 && rv.r <= rv.w && rv.sw <= rv.w, rv);
    await p.screenshot({ path: __dirname + "/school-review-phone.png" });
    ok("no page errors (phone)", !errs.length, errs);
  }
  await b.close();
})();
