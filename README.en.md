# Kvorum · Course

**A course cohort right inside Claude.** Cohort channels, assignments with hand-ins and reviews, and Claude as the curator's assistant, all in one artifact that opens in Claude on desktop and mobile.

It is the school edition of [Kvorum](https://github.com/danial112233/kvorum), a messenger artifact for people who work in Claude together. It is built for online schools that teach Claude and AI: students talk, hand in homework and ask questions in the same place where they learn.

Trial version. The interface is in Russian.

## What it does

- **Roles:** teacher, curator, student, assigned by a teacher in the Team tab.
- **One-tap cohort:** Settings → Course creates these channels:
  - #объявления (announcements, staff only);
  - #вопросы (questions), #домашки (homework) and #флуд (off-topic);
  - a voice channel on Jitsi Meet.

  It also splits students into project groups of 2–5.
- **Assignments:** title, task, criteria and a deadline. They show up in the feed as a card with the deadline, a "handed in 18 of 25" counter and a Hand in button.
- **Hand-ins:** a student replies with text, a file, a voice note or a video circle.
- **Reviews:** the teacher sees each student's status:
  - not handed in;
  - waiting;
  - handed in again;
  - accepted;
  - sent back.

  The teacher sets a grade and a comment, and the student sees the result on the card.
- **AI first review:** the teacher's own Claude drafts a grade and feedback against the criteria. Nothing reaches the student until the teacher presses a button.
- **Teacher tools:**
  - assignment templates;
  - a deadline reminder in #объявления (no names), offered a day before the deadline;
  - a "not handed in" filter with a nudge that @mentions each of them;
  - a course gradebook (students × assignments) with a CSV download;
  - each student's progress, for the student and for the teachers.
- **Curator assistant:** @claude answers from the course programme. When it doesn't know, or the question is about grades, deadlines or personal matters, it marks the answer "needs a curator".
- **From Claude Code:** the `kvorum-course` skill can:
  - post an assignment;
  - list who hasn't handed in;
  - export grades to CSV;
  - add to the programme;
  - assign roles.

## What a school needs

| | One shared Claude account | Claude Team, Enterprise or Claude for Education |
|---|---|---|
| Chat, assignments, hand-ins, reviews, Claude | works | works |
| Roles | an agreement: anyone can change a role | everyone signs in with their own account; access to the artifact is granted by role |
| Grades | the page shows them only to the student and the teachers, but any participant could read them in the database | the same: the database is shared by everyone the artifact is shared with |
| Students from another organization | — | join as guests: they read everything, write text and voice notes, and hand in work |

Full role separation needs Claude Team, Enterprise or Claude for Education, where the school adds students to its organization. On a shared account, Kvorum · Course suits a small cohort that trusts each other.

## Quick start

1. **Publish the page.** In Claude Code, ask: "publish `page/nash-school.html` as an artifact with the db, room, user, assets, sample and downloads capabilities".
2. **Demo data (optional).** `python3 demo/make_seed.py` writes `writes.json`; ask Claude Code to write it into the artifact's database as one batch.
3. **Open the artifact.** Without demo data it offers to set up the course. With demo data, pick Анна, the teacher.
4. **Invite people.** Share → invite by email. Keep link sharing off.
5. **Skill (optional).** Copy `skill/kvorum-course` into `~/.claude/skills/` and replace `<ССЫЛКА_НА_ЧАТ>` with your artifact's link.

## How it's built

The page is built from the Kvorum page (v28 or later) by one patch:

```
python3 patch/patch_school.py <kvorum/page/nash-chat.html> page/nash-school.html
```

Course data lives in the artifact's database:

| Collection | Contents |
|---|---|
| `school/config` | the course name |
| `tasks` | assignments |
| `subs` | each student's latest hand-in per assignment |
| `grades` | reviews |
| `people.role` | roles |

The work itself is an ordinary message that replies to the assignment with a `sub` mark. Field formats are in `skill/kvorum-course/reference.md`.

Tests (65 WebKit checks):

```
cd tests && npm i playwright && npx playwright install webkit
python3 build.py && node school-test.js && node teacher-test.js
```

## Credits and license

Built on [Kvorum](https://github.com/danial112233/kvorum). MIT license, see `LICENSE`. Help setting it up for a school is available via Issues.
