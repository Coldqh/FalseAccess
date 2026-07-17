# FALSE ACCESS — Learning Engine Phase 1

## Назначение

Первый патч создаёт доменное ядро обучения вне React. Он не переписывает старые миссии и не выдаёт их завершение за доказанный навык.

## Реализовано

- единый `MissionDefinition` с briefing, hidden truth, constraints, artifacts, observable outcomes, hypotheses, decisions, assessment rules, solution families, consequences, replay и safety;
- чистый `MissionRuntimeState`;
- журнал событий: start, artifact, command, Python, query, hypothesis, evidence, decision, hint, report, completion и reset;
- semantic assessment по восьми измерениям;
- критические ошибки, блокирующие завершение;
- несколько допустимых путей решения;
- evidence links и гипотезы;
- уровни подсказок 1–5;
- mastery 0–5 на основе evidence, а не XP;
- отдельное версионированное сохранение `false-access-learning-runtime-v1`;
- ограничение action log до 500 событий;
- runtime validation миссии;
- строгая JSON Schema;
- CLINIC-01 описана как первая миссия нового формата;
- новый runtime подключён к приложению и создаётся после первого входа;
- 14 unit-тестов для движка, assessment, mastery и persistence.

## Что принципиально не сделано в этом патче

- старый Terminal пока не пишет структурированные события в runtime;
- нет Evidence Board, Hypothesis Panel и Decision Panel;
- CLINIC-01 пока использует старый UI;
- старые проценты навыков пока не удалены;
- старые миссии пока не мигрированы;
- процедурные контракты пока работают на старом валидаторе.

Это сознательная граница Phase 1. Следующий патч — глава 0.1: новый сюжетный старт, файловая система, реальные action events и первая independent-задача.

## Quality gates

Новая миссия не регистрируется, если:

- нет observable outcomes;
- нет артефактов и ограничений;
- меньше двух допустимых путей;
- отсутствует reset;
- разрешена внешняя сеть;
- solution family ссылается на неизвестное правило;
- completion ссылается на неизвестное правило.
