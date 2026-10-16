"""Values a Claude Code session needs to write into «Кворум · Курс».

Prints, from one clock reading: at (ms), day (UTC), week_ago (UTC), a fresh
writer suffix and message id, and, with --nick, the people document id.
With --task (an existing task id) and --nick: the subs/grades document id
for that student. With --new-task: a fresh task id.

    python3 ids.py
    python3 ids.py --nick "Маша"
    python3 ids.py --new-task
    python3 ids.py --task tdemoweek1prompt --nick "Маша"
"""
import argparse
import datetime as dt
import secrets
import string
import time

ABC = string.ascii_lowercase + string.digits


def rnd(n):
    return "".join(secrets.choice(ABC) for _ in range(n))


def fnv1a(text):
    h = 0x811C9DC5
    for ch in text:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nick")
    ap.add_argument("--task")
    ap.add_argument("--new-task", action="store_true")
    args = ap.parse_args()

    t = time.time()
    u = dt.datetime.fromtimestamp(t, dt.timezone.utc)
    writer = rnd(8)
    print("at", int(t * 1000))
    print("day", u.strftime("%Y-%m-%d"))
    print("week_ago", (u - dt.timedelta(days=7)).strftime("%Y-%m-%d"))
    print("writer", "cc-" + writer)
    print("msgs_doc_id", u.strftime("%Y%m%d") + "-cc-" + writer)
    print("id", rnd(12))
    print("brain_doc_id", rnd(12))
    if args.new_task:
        print("task_id", "t" + rnd(12))
    if args.nick:
        key = args.nick.strip().lower()
        print("people_doc_id", "p-%08x" % fnv1a(key))
        if args.task:
            print("work_doc_id", "%s-%08x" % (args.task, fnv1a(key)))


if __name__ == "__main__":
    main()
