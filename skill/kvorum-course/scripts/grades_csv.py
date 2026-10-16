"""Grades table and «who has not handed in» from an export of «Кворум · Курс».

Export first, with ArtifactData list (out_dir set to one folder) for the
collections tasks, subs, grades and people. Each document lands as
<folder>/<collection>/<doc_id>.json. Then:

    python3 grades_csv.py <folder>                      # CSV of every task and student to stdout
    python3 grades_csv.py <folder> --out grades.csv     # the same into a file (UTF-8 with BOM, opens in Excel)
    python3 grades_csv.py <folder> --missing            # per task: who has not handed in yet
    python3 grades_csv.py <folder> --task <id>          # one task only

Students are everyone in people without a teacher or curator role, plus anyone who handed in.
Times are local to this computer.
"""
import argparse
import csv
import datetime as dt
import io
import json
import os
import sys

STAFF = {"teacher", "curator"}
LABEL = {"none": "не сдано", "late": "не сдано, срок прошёл", "sub": "сдано, ждёт проверки",
         "again": "сдано повторно", "ok": "проверено", "rework": "на доработке"}


def load(folder, name):
    out = []
    d = os.path.join(folder, name)
    if not os.path.isdir(d):
        return out
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".json"):
            continue
        try:
            with open(os.path.join(d, fn), encoding="utf-8") as f:
                doc = json.load(f)
        except (OSError, ValueError):
            continue
        if isinstance(doc, dict):
            doc["_id"] = fn[:-5]
            out.append(doc)
    return out


def key(nick):
    return str(nick or "").strip().lower()


def when(ms):
    try:
        return dt.datetime.fromtimestamp(int(ms) / 1000).strftime("%d.%m.%Y %H:%M") if ms else ""
    except (TypeError, ValueError, OverflowError, OSError):
        return ""


def latest(docs, who_field):
    best = {}
    for d in docs:
        t, n = d.get("task"), d.get(who_field)
        if not isinstance(t, str) or not isinstance(n, str):
            continue
        k = (t, key(n))
        if k not in best or (d.get("at") or 0) > (best[k].get("at") or 0):
            best[k] = d
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--out")
    ap.add_argument("--task")
    ap.add_argument("--missing", action="store_true")
    a = ap.parse_args()

    tasks = [t for t in load(a.folder, "tasks") if isinstance(t.get("title"), str)]
    if a.task:
        tasks = [t for t in tasks if t["_id"] == a.task]
    tasks.sort(key=lambda t: t.get("at") or 0)
    people = load(a.folder, "people")
    subs = latest(load(a.folder, "subs"), "nick")
    grades = latest(load(a.folder, "grades"), "student")

    names = {}
    staff = set()
    for p in people:
        n = p.get("nick")
        if not isinstance(n, str) or not n.strip():
            continue
        if p.get("role") in STAFF:
            staff.add(key(n))
        else:
            names[key(n)] = n
    for (_, k), s in subs.items():
        if k not in staff:
            names.setdefault(k, s.get("nick"))
    students = sorted(names.values(), key=lambda n: n.lower())
    now = dt.datetime.now().timestamp() * 1000

    rows = []
    for t in tasks:
        for n in students:
            s, g = subs.get((t["_id"], key(n))), grades.get((t["_id"], key(n)))
            if not s and not g:
                st = "late" if t.get("due") and now > t["due"] else "none"
            elif g and (not s or (g.get("at") or 0) >= (s.get("at") or 0)):
                st = g.get("status") if g.get("status") in ("ok", "rework") else "sub"
            else:
                st = "again" if g else "sub"
            rows.append((t, n, st, s, g))

    if a.missing:
        for t in tasks:
            left = [n for (tt, n, st, s, g) in rows if tt is t and st in ("none", "late")]
            due = (" (срок " + when(t.get("due")) + ")") if t.get("due") else ""
            print("«%s»%s: не сдали %d из %d%s" % (t["title"], due, len(left), len(students), (" — " + ", ".join(left)) if left else ""))
        return

    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow(["Задание", "Срок", "Ученик", "Статус", "Сдано", "Попытка", "Оценка", "Комментарий", "Проверил", "Когда проверено"])
    for t, n, st, s, g in rows:
        w.writerow([t["title"], when(t.get("due")), n, LABEL[st], when(s.get("at")) if s else "", (s.get("n") or 1) if s else "",
                    (g.get("grade") or "") if g else "", (g.get("comment") or "") if g else "", (g.get("by") or "") if g else "", when(g.get("at")) if g else ""])
    if a.out:
        with open(a.out, "w", encoding="utf-8-sig", newline="") as f:
            f.write(buf.getvalue())
        print("Записано: %s (%d строк)" % (a.out, len(rows)))
    else:
        sys.stdout.write(buf.getvalue())


if __name__ == "__main__":
    main()
