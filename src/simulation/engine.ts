import { foodPlans, housingCatalog, jobsCatalog } from './catalog';
import { activityById, createDailyEvent, getDailyEvent, isScheduledWorkPeriod, periodKey } from './daily';
import type {
  DailyActivityId, DayPeriod, HeatState, SimulationEvent, SimulationSkillId, SimulationState, SkillTrackState,
} from './types';

const PERIODS: DayPeriod[] = ['morning', 'workday', 'evening', 'night'];
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

function blankSkill(): SkillTrackState {
  return { theory: 0, guided: 0, independent: 0, production: 0 };
}

function createSkills(): Record<SimulationSkillId, SkillTrackState> {
  return {
    computer: blankSkill(),
    linux: blankSkill(),
    bash: blankSkill(),
    windows: blankSkill(),
    powershell: blankSkill(),
    networking: blankSkill(),
    python: blankSkill(),
    web: blankSkill(),
    sql: blankSkill(),
    soc: blankSkill(),
    siem: blankSkill(),
    incidentResponse: blankSkill(),
    forensics: blankSkill(),
    threatHunting: blankSkill(),
    securityEngineering: blankSkill(),
    appsec: blankSkill(),
    cloud: blankSkill(),
    activeDirectory: blankSkill(),
    communication: blankSkill(),
    operationalPlanning: blankSkill(),
  };
}

export function calculateWantedLevel(heat: Omit<HeatState, 'wantedLevel'> | HeatState) {
  const score = heat.digitalTrace * 0.22
    + heat.corporateSuspicion * 0.25
    + heat.lawAttention * 0.35
    + heat.criminalExposure * 0.18;
  if (score >= 75) return 5;
  if (score >= 55) return 4;
  if (score >= 38) return 3;
  if (score >= 22) return 2;
  if (score >= 8) return 1;
  return 0;
}

function normalizeHeat(heat: HeatState): HeatState {
  const next = {
    digitalTrace: clamp(heat.digitalTrace),
    corporateSuspicion: clamp(heat.corporateSuspicion),
    lawAttention: clamp(heat.lawAttention),
    criminalExposure: clamp(heat.criminalExposure),
    wantedLevel: 0,
  };
  next.wantedLevel = calculateWantedLevel(next);
  return next;
}

export function createInitialSimulation(storyJob = false, firstShiftComplete = false): SimulationState {
  return {
    schemaVersion: 3,
    clock: { day: 1, dateIso: '2026-03-17', period: 'evening', elapsedSlots: 0 },
    needs: { energy: 78, stress: 16, health: 94, focus: 76 },
    foodPlanId: 'normal',
    housing: { currentHousingId: 'family-room', nextRentDay: 30, movedAtDay: 1 },
    inventory: [
      { itemId: 'old-pc', quantity: 1, condition: 58 },
      { itemId: 'main-phone', quantity: 1, condition: 74 },
    ],
    career: storyJob ? {
      status: 'employed', jobId: 'sfera-junior-soc', employerId: 'sfera', title: 'Младший аналитик SOC',
      monthlySalary: 52_000, nextPayDay: 30, shiftsWorked: firstShiftComplete ? 1 : 0,
      performance: firstShiftComplete ? 52 : 50, warnings: 0, storyJobProcessed: true,
      storyShiftProcessed: firstShiftComplete,
    } : {
      status: 'unemployed', jobId: '', employerId: '', title: 'Без работы', monthlySalary: 0,
      nextPayDay: 30, shiftsWorked: 0, performance: 50, warnings: 0,
      storyJobProcessed: false, storyShiftProcessed: false,
    },
    reputation: { professional: firstShiftComplete ? 3 : 0, reliability: 2, underground: 0, notoriety: 0 },
    heat: { digitalTrace: 0, corporateSuspicion: 0, lawAttention: 0, criminalExposure: 0, wantedLevel: 0 },
    skills: createSkills(),
    progression: { passedExamIds: [], selectedSpecializations: [] },
    daily: {
      planDay: 1,
      plan: { evening: 'study-linux', night: 'sleep' },
      completedKeys: [],
      missedShifts: 0,
      lastContractBoardDay: 0,
      event: null,
      resolvedEventIds: [],
    },
    world: { currentCityId: 'ostrogorsk', unlockedCityIds: ['ostrogorsk'] },
    events: [{ id: 'sim-start', day: 1, period: 'evening', type: 'time', title: 'Система жизни запущена', text: 'Расходы, время, жильё и работа теперь считаются отдельно от сюжета.' }],
    settledThroughDay: 1,
  };
}

export function normalizeSimulation(value: unknown, storyJob: boolean, firstShiftComplete: boolean): SimulationState {
  const fallback = createInitialSimulation(storyJob, firstShiftComplete);
  if (!value || typeof value !== 'object') return fallback;
  const parsed = value as Partial<SimulationState>;
  const skills = { ...fallback.skills, ...(parsed.skills ?? {}) };
  (Object.keys(skills) as SimulationSkillId[]).forEach((id) => {
    skills[id] = { ...fallback.skills[id], ...(skills[id] ?? {}) };
  });
  const heat = normalizeHeat({ ...fallback.heat, ...(parsed.heat ?? {}) });
  return {
    ...fallback,
    ...parsed,
    schemaVersion: 3,
    clock: { ...fallback.clock, ...(parsed.clock ?? {}) },
    needs: {
      energy: clamp(parsed.needs?.energy ?? fallback.needs.energy),
      stress: clamp(parsed.needs?.stress ?? fallback.needs.stress),
      health: clamp(parsed.needs?.health ?? fallback.needs.health),
      focus: clamp(parsed.needs?.focus ?? fallback.needs.focus),
    },
    housing: { ...fallback.housing, ...(parsed.housing ?? {}) },
    inventory: Array.isArray(parsed.inventory) ? parsed.inventory : fallback.inventory,
    career: { ...fallback.career, ...(parsed.career ?? {}) },
    reputation: { ...fallback.reputation, ...(parsed.reputation ?? {}) },
    heat,
    skills,
    progression: {
      ...fallback.progression,
      ...(parsed.progression ?? {}),
      passedExamIds: Array.isArray(parsed.progression?.passedExamIds) ? parsed.progression!.passedExamIds.filter((item): item is string => typeof item === 'string') : fallback.progression.passedExamIds,
      selectedSpecializations: Array.isArray(parsed.progression?.selectedSpecializations) ? parsed.progression!.selectedSpecializations.slice(0, 2) : fallback.progression.selectedSpecializations,
    },
    daily: {
      ...fallback.daily,
      ...(parsed.daily ?? {}),
      planDay: Number.isFinite(Number(parsed.daily?.planDay)) ? Number(parsed.daily?.planDay) : fallback.daily.planDay,
      plan: parsed.daily?.plan && typeof parsed.daily.plan === 'object' ? parsed.daily.plan : fallback.daily.plan,
      completedKeys: Array.isArray(parsed.daily?.completedKeys) ? parsed.daily!.completedKeys.filter((item): item is string => typeof item === 'string').slice(-40) : fallback.daily.completedKeys,
      missedShifts: Number.isFinite(Number(parsed.daily?.missedShifts)) ? Number(parsed.daily?.missedShifts) : 0,
      lastContractBoardDay: Number.isFinite(Number(parsed.daily?.lastContractBoardDay)) ? Number(parsed.daily?.lastContractBoardDay) : 0,
      event: parsed.daily?.event && typeof parsed.daily.event === 'object' ? parsed.daily.event : null,
      resolvedEventIds: Array.isArray(parsed.daily?.resolvedEventIds) ? parsed.daily!.resolvedEventIds.filter((item): item is string => typeof item === 'string').slice(-30) : [],
    },
    world: { ...fallback.world, ...(parsed.world ?? {}), unlockedCityIds: Array.isArray(parsed.world?.unlockedCityIds) ? parsed.world!.unlockedCityIds : fallback.world.unlockedCityIds },
    events: Array.isArray(parsed.events) ? parsed.events.slice(0, 60) : fallback.events,
    settledThroughDay: Number.isFinite(Number(parsed.settledThroughDay)) ? Number(parsed.settledThroughDay) : fallback.settledThroughDay,
  };
}

export function recordSimulationEvent(sim: SimulationState, type: SimulationEvent['type'], title: string, text: string, amount?: number) {
  const nextEvent: SimulationEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    day: sim.clock.day,
    period: sim.clock.period,
    type,
    title,
    text,
    amount,
  };
  return { ...sim, events: [nextEvent, ...sim.events].slice(0, 60) };
}

function nextClock(clock: SimulationState['clock']) {
  const index = PERIODS.indexOf(clock.period);
  const nextIndex = (index + 1) % PERIODS.length;
  const crossedDay = nextIndex === 0;
  const date = new Date(`${clock.dateIso}T12:00:00`);
  if (crossedDay) date.setDate(date.getDate() + 1);
  return {
    day: crossedDay ? clock.day + 1 : clock.day,
    dateIso: date.toISOString().slice(0, 10),
    period: PERIODS[nextIndex],
    elapsedSlots: clock.elapsedSlots + 1,
  };
}

function settleNewDay(simulation: SimulationState, balance: number) {
  let sim = simulation;
  let nextBalance = balance;
  const plan = foodPlans.find((item) => item.id === sim.foodPlanId) ?? foodPlans[1];
  nextBalance -= plan.dailyCost;
  sim = recordSimulationEvent(sim, 'expense', 'Еда', `${plan.name}: списано ${plan.dailyCost.toLocaleString('ru-RU')} ₽.`, -plan.dailyCost);
  sim = {
    ...sim,
    needs: {
      energy: clamp(sim.needs.energy + plan.energyRecovery),
      stress: clamp(sim.needs.stress - plan.stressRecovery),
      health: clamp(sim.needs.health + plan.healthDelta),
      focus: clamp(sim.needs.focus + Math.ceil(plan.energyRecovery / 2)),
    },
  };

  if (sim.clock.day >= sim.housing.nextRentDay) {
    const housing = housingCatalog.find((item) => item.id === sim.housing.currentHousingId) ?? housingCatalog[0];
    if (housing.rent > 0) {
      nextBalance -= housing.rent;
      sim = recordSimulationEvent(sim, 'expense', 'Аренда', `${housing.name}: списано ${housing.rent.toLocaleString('ru-RU')} ₽.`, -housing.rent);
      if (nextBalance < 0) sim = { ...sim, needs: { ...sim.needs, stress: clamp(sim.needs.stress + 12) } };
    }
    sim = { ...sim, housing: { ...sim.housing, nextRentDay: sim.housing.nextRentDay + 30 } };
  }

  if (sim.career.status === 'employed' && sim.clock.day >= sim.career.nextPayDay) {
    nextBalance += sim.career.monthlySalary;
    sim = recordSimulationEvent(sim, 'income', 'Зарплата', `${sim.career.title}: зачислено ${sim.career.monthlySalary.toLocaleString('ru-RU')} ₽.`, sim.career.monthlySalary);
    sim = { ...sim, career: { ...sim.career, nextPayDay: sim.career.nextPayDay + 30 } };
  }

  sim = {
    ...sim,
    daily: {
      ...sim.daily,
      planDay: sim.clock.day,
      plan: {},
      event: null,
    },
  };
  sim = { ...sim, daily: { ...sim.daily, event: createDailyEvent(sim, nextBalance) } };
  return { simulation: { ...sim, settledThroughDay: sim.clock.day }, balance: nextBalance };
}

export type TimeAdvanceMode = 'free' | 'rest' | 'work' | 'maintenance' | 'study' | 'contract';

function applyMissedShift(simulation: SimulationState, mode: TimeAdvanceMode) {
  if (!isScheduledWorkPeriod(simulation) || mode === 'work') return simulation;
  const nextWarnings = simulation.career.warnings + 1;
  let sim: SimulationState = {
    ...simulation,
    career: {
      ...simulation.career,
      performance: clamp(simulation.career.performance - 5),
      warnings: nextWarnings,
    },
    reputation: {
      ...simulation.reputation,
      reliability: clamp(simulation.reputation.reliability - 2),
      professional: clamp(simulation.reputation.professional - 1),
    },
    needs: { ...simulation.needs, stress: clamp(simulation.needs.stress + 7) },
    daily: { ...simulation.daily, missedShifts: simulation.daily.missedShifts + 1 },
  };
  sim = recordSimulationEvent(sim, 'career', 'Пропущена смена', 'Рабочий период закончился без выхода на смену.');
  return sim;
}

function markPeriodCompleted(simulation: SimulationState) {
  const key = periodKey(simulation.clock.day, simulation.clock.period);
  if (simulation.daily.completedKeys.includes(key)) return simulation;
  return {
    ...simulation,
    daily: {
      ...simulation.daily,
      completedKeys: [...simulation.daily.completedKeys, key].slice(-40),
    },
  };
}

export function advanceSlots(simulation: SimulationState, balance: number, slots: number, mode: TimeAdvanceMode = 'free') {
  let sim = simulation;
  let nextBalance = balance;
  for (let i = 0; i < slots; i += 1) {
    sim = markPeriodCompleted(applyMissedShift(sim, mode));
    const previousDay = sim.clock.day;
    sim = { ...sim, clock: nextClock(sim.clock) };
    if (sim.clock.day > previousDay) {
      const settled = settleNewDay(sim, nextBalance);
      sim = settled.simulation;
      nextBalance = settled.balance;
    }
  }

  const scale = Math.max(1, slots);
  const deltas = mode === 'rest'
    ? { energy: 20 * scale, stress: -8 * scale, health: 1 * scale, focus: 12 * scale }
    : mode === 'work'
      ? { energy: -24 * scale, stress: 11 * scale, health: 0, focus: -13 * scale }
      : mode === 'maintenance'
        ? { energy: -7 * scale, stress: -3 * scale, health: 0, focus: -5 * scale }
        : mode === 'study'
          ? { energy: -13 * scale, stress: 5 * scale, health: 0, focus: -11 * scale }
          : mode === 'contract'
            ? { energy: -17 * scale, stress: 7 * scale, health: 0, focus: -13 * scale }
            : { energy: -8 * scale, stress: 2 * scale, health: 0, focus: -6 * scale };

  sim = {
    ...sim,
    needs: {
      energy: clamp(sim.needs.energy + deltas.energy),
      stress: clamp(sim.needs.stress + deltas.stress),
      health: clamp(sim.needs.health + deltas.health),
      focus: clamp(sim.needs.focus + deltas.focus),
    },
  };
  return { simulation: sim, balance: nextBalance };
}

export function restUntilMorning(simulation: SimulationState, balance: number) {
  const current = PERIODS.indexOf(simulation.clock.period);
  const slots = current === 0 ? 4 : PERIODS.length - current;
  const result = advanceSlots(simulation, balance, slots, 'rest');
  result.simulation = recordSimulationEvent(result.simulation, 'time', 'Сон', 'Илья отдохнул до утра.');
  return result;
}

export function workCompanyShift(simulation: SimulationState, balance: number) {
  if (!isScheduledWorkPeriod(simulation)) return { simulation, balance };
  const result = advanceSlots(simulation, balance, 1, 'work');
  let sim = result.simulation;
  const badState = simulation.needs.energy < 30 || simulation.needs.focus < 25;
  sim = {
    ...sim,
    career: {
      ...sim.career,
      shiftsWorked: sim.career.shiftsWorked + 1,
      performance: clamp(sim.career.performance + (badState ? -3 : 2)),
      warnings: sim.career.warnings + (badState && sim.career.performance < 35 ? 1 : 0),
    },
    reputation: {
      ...sim.reputation,
      professional: clamp(sim.reputation.professional + (badState ? 0 : 1)),
      reliability: clamp(sim.reputation.reliability + (badState ? -1 : 1)),
    },
    skills: {
      ...sim.skills,
      soc: { ...sim.skills.soc, production: clamp(sim.skills.soc.production + 2) },
      communication: { ...sim.skills.communication, production: clamp(sim.skills.communication.production + 1) },
    },
  };
  sim = recordSimulationEvent(sim, 'career', 'Рабочая смена', badState ? 'Смена закрыта тяжело. Низкая концентрация ухудшила результат.' : 'Смена закрыта без серьёзных ошибок.');
  return { ...result, simulation: sim };
}

export function takeJob(simulation: SimulationState, jobId: string) {
  const job = jobsCatalog.find((item) => item.id === jobId);
  if (!job) return simulation;
  return recordSimulationEvent({
    ...simulation,
    career: {
      status: 'employed', jobId: job.id, employerId: job.employerId, title: job.title,
      monthlySalary: job.monthlySalary, nextPayDay: simulation.clock.day + 30,
      shiftsWorked: 0, performance: 50, warnings: 0,
      storyJobProcessed: simulation.career.storyJobProcessed,
      storyShiftProcessed: simulation.career.storyShiftProcessed,
    },
  }, 'career', 'Новая работа', `${job.employer}: ${job.title}.`);
}

export function quitCurrentJob(simulation: SimulationState) {
  if (simulation.career.status !== 'employed') return simulation;
  const oldTitle = simulation.career.title;
  return recordSimulationEvent({
    ...simulation,
    career: {
      ...simulation.career,
      status: 'unemployed', jobId: '', employerId: '', title: 'Без работы', monthlySalary: 0,
      performance: 50, warnings: 0,
    },
    reputation: { ...simulation.reputation, reliability: clamp(simulation.reputation.reliability - 2) },
  }, 'career', 'Увольнение', `Илья ушёл с позиции «${oldTitle}».`);
}

export function reduceDigitalRisk(simulation: SimulationState, balance: number) {
  if (balance < 600) return { simulation, balance };
  const advanced = advanceSlots(simulation, balance - 600, 1, 'maintenance');
  let sim = {
    ...advanced.simulation,
    heat: normalizeHeat({
      ...advanced.simulation.heat,
      digitalTrace: advanced.simulation.heat.digitalTrace - 12,
      corporateSuspicion: advanced.simulation.heat.corporateSuspicion - 3,
    }),
  };
  sim = recordSimulationEvent(sim, 'risk', 'Проверка устройств', 'Обновлены пароли, закрыты старые сессии, резервная копия проверена.', -600);
  return { simulation: sim, balance: advanced.balance };
}

export function moveToHousing(simulation: SimulationState, balance: number, housingId: string) {
  const target = housingCatalog.find((item) => item.id === housingId);
  if (!target || target.cityId !== simulation.world.currentCityId || target.id === simulation.housing.currentHousingId) return { simulation, balance };
  const cost = target.deposit + target.rent;
  if (balance < cost) return { simulation, balance };
  let sim = {
    ...simulation,
    housing: { currentHousingId: target.id, nextRentDay: simulation.clock.day + 30, movedAtDay: simulation.clock.day },
    needs: { ...simulation.needs, stress: clamp(simulation.needs.stress + 5), energy: clamp(simulation.needs.energy - 8) },
  };
  sim = recordSimulationEvent(sim, 'housing', 'Переезд', `${target.name}. Оплачены первый месяц и залог.`, -cost);
  return { simulation: sim, balance: balance - cost };
}

export function buyStoreItem(simulation: SimulationState, balance: number, itemId: string, price: number) {
  if (balance < price || simulation.inventory.some((entry) => entry.itemId === itemId)) return { simulation, balance };
  let sim = {
    ...simulation,
    inventory: [...simulation.inventory, { itemId, quantity: 1, condition: 100 }],
  };
  sim = recordSimulationEvent(sim, 'purchase', 'Покупка', `Оборудование добавлено в инвентарь.`, -price);
  return { simulation: sim, balance: balance - price };
}


export function setPlannedActivity(simulation: SimulationState, period: DayPeriod, activityId: DailyActivityId) {
  const plan = simulation.daily.planDay === simulation.clock.day ? simulation.daily.plan : {};
  return {
    ...simulation,
    daily: {
      ...simulation.daily,
      planDay: simulation.clock.day,
      plan: { ...plan, [period]: activityId },
    },
  };
}

export function markContractBoardDay(simulation: SimulationState, day: number) {
  return { ...simulation, daily: { ...simulation.daily, lastContractBoardDay: day } };
}

export function performDailyActivity(simulation: SimulationState, balance: number, activityId: DailyActivityId) {
  if (activityId === 'work') return workCompanyShift(simulation, balance);
  if (activityId === 'maintenance') return reduceDigitalRisk(simulation, balance);
  if (activityId === 'sleep') {
    const result = advanceSlots(simulation, balance, 1, 'rest');
    return { ...result, simulation: recordSimulationEvent(result.simulation, 'time', 'Отдых', 'Илья выключил уведомления и отдохнул один период.') };
  }
  const definition = activityById(activityId);
  if (definition.kind === 'study' && definition.skillId) {
    const result = advanceSlots(simulation, balance, 1, 'study');
    const current = result.simulation.skills[definition.skillId];
    const lowFocus = simulation.needs.focus < 30;
    const gain = lowFocus ? 1 : 3;
    let sim: SimulationState = {
      ...result.simulation,
      skills: {
        ...result.simulation.skills,
        [definition.skillId]: {
          ...current,
          theory: clamp(current.theory + gain),
          guided: clamp(current.guided + Math.max(1, gain - 1)),
        },
      },
    };
    sim = recordSimulationEvent(sim, 'progression', definition.label, lowFocus ? 'Из-за усталости занятие дало мало результата.' : 'Закрыт один учебный блок с практикой.');
    return { ...result, simulation: sim };
  }
  const result = advanceSlots(simulation, balance, 1, 'free');
  return { ...result, simulation: recordSimulationEvent(result.simulation, 'time', 'Свободный период', 'Илья не ставил отдельную задачу на этот период.') };
}

export function resolveDailyEvent(simulation: SimulationState, balance: number, choiceId: string) {
  const current = simulation.daily.event;
  if (!current || current.resolvedChoiceId) return { simulation, balance };
  const definition = getDailyEvent(current.id);
  if (!definition || !definition.choices.some((choice) => choice.id === choiceId)) return { simulation, balance };
  let sim = simulation;
  let nextBalance = balance;

  if (current.id === 'account-alert') {
    if (choiceId === 'secure' && balance >= 250) {
      nextBalance -= 250;
      sim = { ...sim, heat: normalizeHeat({ ...sim.heat, digitalTrace: sim.heat.digitalTrace - 7 }) };
    } else if (choiceId === 'ignore') {
      sim = { ...sim, heat: normalizeHeat({ ...sim.heat, digitalTrace: sim.heat.digitalTrace + 7 }) };
    }
  }
  if (current.id === 'extra-shift') {
    if (choiceId === 'accept') {
      nextBalance += 900;
      sim = {
        ...sim,
        needs: { ...sim.needs, energy: clamp(sim.needs.energy - 13), stress: clamp(sim.needs.stress + 8) },
        career: { ...sim.career, performance: clamp(sim.career.performance + 2) },
      };
    }
  }
  if (current.id === 'router-failure') {
    if (choiceId === 'repair' && balance >= 500) nextBalance -= 500;
    if (choiceId === 'postpone') sim = { ...sim, needs: { ...sim.needs, stress: clamp(sim.needs.stress + 5), focus: clamp(sim.needs.focus - 5) } };
  }
  if (current.id === 'family-errand') {
    if (choiceId === 'help') {
      sim = {
        ...sim,
        needs: { ...sim.needs, energy: clamp(sim.needs.energy - 6), stress: clamp(sim.needs.stress - 3) },
        reputation: { ...sim.reputation, reliability: clamp(sim.reputation.reliability + 1) },
      };
    } else {
      sim = { ...sim, needs: { ...sim.needs, stress: clamp(sim.needs.stress + 4) } };
    }
  }

  const choice = definition.choices.find((item) => item.id === choiceId)!;
  sim = {
    ...sim,
    daily: {
      ...sim.daily,
      event: { ...current, resolvedChoiceId: choiceId },
      resolvedEventIds: [...sim.daily.resolvedEventIds, `${current.day}:${current.id}:${choiceId}`].slice(-30),
    },
  };
  sim = recordSimulationEvent(sim, 'daily', definition.title, choice.result, nextBalance - balance || undefined);
  return { simulation: sim, balance: nextBalance };
}

export function syncStoryProgress(simulation: SimulationState, story: {
  jobAccepted: boolean;
  firstShiftComplete: boolean;
  terminalObjectives: string[];
  pythonComplete: boolean;
  alertReviewed: boolean;
  interviewScore: number;
  phishingComplete: boolean;
  powershellComplete: boolean;
  dnsComplete: boolean;
}) {
  let sim = simulation;
  if (story.jobAccepted && !sim.career.storyJobProcessed) {
    sim = takeJob(sim, 'sfera-junior-soc');
    sim = { ...sim, career: { ...sim.career, storyJobProcessed: true } };
  }

  const terminalProgress = Math.min(18, story.terminalObjectives.length * 3);
  const nextSkills = {
    ...sim.skills,
    computer: {
      ...sim.skills.computer,
      theory: Math.max(sim.skills.computer.theory, story.terminalObjectives.length >= 3 ? 12 : 0),
      guided: Math.max(sim.skills.computer.guided, story.terminalObjectives.length >= 3 ? 12 : 0),
    },
    linux: {
      ...sim.skills.linux,
      theory: Math.max(sim.skills.linux.theory, terminalProgress),
      guided: Math.max(sim.skills.linux.guided, terminalProgress),
    },
    bash: {
      ...sim.skills.bash,
      theory: Math.max(sim.skills.bash.theory, Math.min(10, story.terminalObjectives.length * 2)),
      guided: Math.max(sim.skills.bash.guided, Math.min(12, story.terminalObjectives.length * 2)),
    },
    python: {
      ...sim.skills.python,
      theory: Math.max(sim.skills.python.theory, story.pythonComplete ? 14 : 0),
      guided: Math.max(sim.skills.python.guided, story.pythonComplete ? 16 : 0),
    },
    soc: {
      ...sim.skills.soc,
      theory: Math.max(sim.skills.soc.theory, story.alertReviewed ? 10 : 0),
      guided: Math.max(sim.skills.soc.guided, story.alertReviewed ? 12 : 0),
    },
    siem: {
      ...sim.skills.siem,
      theory: Math.max(sim.skills.siem.theory, story.alertReviewed ? 8 : 0),
      guided: Math.max(sim.skills.siem.guided, story.alertReviewed ? 10 : 0),
    },
    incidentResponse: {
      ...sim.skills.incidentResponse,
      theory: Math.max(sim.skills.incidentResponse.theory, story.alertReviewed ? 6 : 0),
      guided: Math.max(sim.skills.incidentResponse.guided, story.alertReviewed ? 6 : 0),
    },
    communication: {
      ...sim.skills.communication,
      guided: Math.max(sim.skills.communication.guided, story.interviewScore * 2),
    },
    windows: {
      ...sim.skills.windows,
      theory: Math.max(sim.skills.windows.theory, story.powershellComplete ? 10 : 0),
      guided: Math.max(sim.skills.windows.guided, story.powershellComplete ? 12 : 0),
    },
    powershell: {
      ...sim.skills.powershell,
      theory: Math.max(sim.skills.powershell.theory, story.powershellComplete ? 6 : 0),
      guided: Math.max(sim.skills.powershell.guided, story.powershellComplete ? 7 : 0),
    },
    networking: {
      ...sim.skills.networking,
      theory: Math.max(sim.skills.networking.theory, story.dnsComplete ? 10 : 0),
      guided: Math.max(sim.skills.networking.guided, story.dnsComplete ? 12 : 0),
    },
    web: {
      ...sim.skills.web,
      theory: Math.max(sim.skills.web.theory, story.phishingComplete ? 5 : 0),
    },
  };
  sim = { ...sim, skills: nextSkills };

  if (story.firstShiftComplete && !sim.career.storyShiftProcessed) {
    sim = {
      ...sim,
      career: { ...sim.career, shiftsWorked: Math.max(1, sim.career.shiftsWorked), storyShiftProcessed: true },
      reputation: { ...sim.reputation, professional: Math.max(3, sim.reputation.professional) },
      skills: {
        ...sim.skills,
        soc: { ...sim.skills.soc, guided: Math.max(12, sim.skills.soc.guided), production: Math.max(4, sim.skills.soc.production) },
        siem: { ...sim.skills.siem, guided: Math.max(10, sim.skills.siem.guided), production: Math.max(3, sim.skills.siem.production) },
        incidentResponse: { ...sim.skills.incidentResponse, guided: Math.max(7, sim.skills.incidentResponse.guided), production: Math.max(2, sim.skills.incidentResponse.production) },
        windows: { ...sim.skills.windows, guided: Math.max(8, sim.skills.windows.guided) },
        networking: { ...sim.skills.networking, guided: Math.max(8, sim.skills.networking.guided) },
        communication: { ...sim.skills.communication, guided: Math.max(8, sim.skills.communication.guided), production: Math.max(2, sim.skills.communication.production) },
      },
    };
  }
  return sim;
}

export function skillMeets(skill: SkillTrackState, requirement: number) {
  return Math.max(skill.independent, skill.production, Math.round((skill.theory + skill.guided) / 2)) >= requirement;
}
