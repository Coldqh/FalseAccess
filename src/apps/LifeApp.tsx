import { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Banknote, BedDouble, BookOpenCheck, BriefcaseBusiness, Building2, CalendarClock, CalendarDays,
  Check, ChevronRight, Clock3, Coffee, Cpu, CreditCard, Gauge, HardDrive, HeartPulse,
  FileClock, Home, Laptop, ListChecks, MapPin, PackageCheck, Play, Router, ShieldAlert, ShieldCheck, ShoppingBag,
  Smartphone, Utensils, Wifi, X,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import { cities, foodPlans, housingCatalog, jobsCatalog, periodLabels, storeItems } from '../simulation/catalog';
import { getCurrentStage, getJobAccess } from '../simulation/progression';
import { getCityLocation, isLocationOpen } from '../simulation/city';
import { activityById, dailyActivities, dayPeriods, getDailyEvent, isScheduledWorkPeriod, periodKey } from '../simulation/daily';
import type { AppId } from '../types';
import type { DailyActivityId, FoodPlanId } from '../simulation/types';

const tabs = [
  { id: 'today', label: 'Сегодня', icon: CalendarClock },
  { id: 'overview', label: 'Жизнь', icon: Activity },
  { id: 'housing', label: 'Жильё', icon: Home },
  { id: 'market', label: 'Магазин', icon: ShoppingBag },
  { id: 'career', label: 'Работа', icon: BriefcaseBusiness },
  { id: 'risk', label: 'Риск', icon: ShieldAlert },
] as const;

type TabId = typeof tabs[number]['id'];

function meterClass(value: number, inverse = false) {
  const bad = inverse ? value >= 65 : value <= 30;
  const warn = inverse ? value >= 35 : value <= 55;
  return bad ? 'bad' : warn ? 'warn' : 'good';
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00`));
}

function itemIcon(category: string) {
  if (category === 'computer') return Laptop;
  if (category === 'component') return Cpu;
  if (category === 'network') return Router;
  if (category === 'phone') return Smartphone;
  return HardDrive;
}

function heatText(level: number) {
  return [
    'Никто не интересуется',
    'Отдельные события замечены',
    'Собирают информацию',
    'Проверяют связи и устройства',
    'Счета и жильё под наблюдением',
    'Активный розыск',
  ][level] ?? 'Неизвестно';
}

export function LifeApp({ openApp }: { openApp: (id: AppId) => void }) {
  const {
    progress, advanceTime, rest, setFoodPlan, buyItem, changeHousing,
    workShift, acceptJob, quitJob, secureDevices, setDayPlan, performActivity, resolveDayEvent,
  } = useProgress();
  const [tab, setTab] = useState<TabId>('today');
  const [confirmQuit, setConfirmQuit] = useState(false);
  const sim = progress.simulation;
  const city = cities.find((entry) => entry.id === sim.world.currentCityId) ?? cities[0];
  const housing = housingCatalog.find((entry) => entry.id === sim.housing.currentHousingId) ?? housingCatalog[0];
  const currentLocation = getCityLocation(sim.world.currentLocationId);
  const foodPlan = foodPlans.find((entry) => entry.id === sim.foodPlanId) ?? foodPlans[1];
  const owned = new Set(sim.inventory.map((entry) => entry.itemId));
  const equipment = useMemo(() => ({
    compute: 1 + Number(owned.has('ram-16')) + Number(owned.has('used-laptop')),
    storage: 1 + Number(owned.has('used-ssd')) + Number(owned.has('backup-drive')),
    network: 1 + Number(owned.has('usb-nic')),
    resilience: Number(owned.has('ups')) + Number(owned.has('backup-drive')) + Number(owned.has('used-laptop')),
  }), [sim.inventory]);

  const currentJob = jobsCatalog.find((entry) => entry.id === sim.career.jobId);
  const workplace = currentJob?.locationId ? getCityLocation(currentJob.locationId) : undefined;
  const atWorkplace = Boolean(currentJob?.remote || (currentJob?.locationId && currentJob.locationId === sim.world.currentLocationId));
  const canWork = isScheduledWorkPeriod(sim) && atWorkplace && (!workplace || isLocationOpen(workplace, sim.clock.period)) && sim.needs.energy >= 25 && sim.needs.focus >= 20;
  const stage = getCurrentStage(progress);
  const periodIndex = dayPeriods.indexOf(sim.clock.period);
  const storyTarget: AppId = !progress.clinicWrapupComplete
    ? 'missions'
    : !progress.interviewComplete
      ? 'interview'
      : !progress.jobAccepted
        ? 'mail'
        : !progress.firstShiftComplete
          ? 'firstshift'
          : progress.criminalContactUnlocked && !progress.criminalContactResponse
            ? 'messenger'
            : 'missions';
  const storyLabel = !progress.clinicWrapupComplete
    ? 'Дело клиники'
    : !progress.interviewComplete
      ? 'Собеседование'
      : !progress.jobAccepted
        ? 'Ответить на предложение'
        : !progress.firstShiftComplete
          ? 'Первая смена'
          : progress.criminalContactUnlocked && !progress.criminalContactResponse
            ? 'Незнакомый номер'
            : 'Текущая глава';
  const defaultActivity: DailyActivityId = isScheduledWorkPeriod(sim)
    ? 'work'
    : sim.clock.period === 'night'
      ? 'sleep'
      : progress.activeContract
        ? 'contract'
        : 'study-linux';
  const currentActivityId = sim.daily.planDay === sim.clock.day
    ? (sim.daily.plan[sim.clock.period] ?? defaultActivity)
    : defaultActivity;
  const currentActivity = activityById(currentActivityId);
  const dailyEvent = sim.daily.event ? getDailyEvent(sim.daily.event.id) : undefined;
  const activeDeadline = progress.activeContract?.deadlineDay ?? null;
  const daysToDeadline = activeDeadline === null ? null : activeDeadline - sim.clock.day;
  const activityOptions = dailyActivities.filter((item) => {
    if (item.id === 'work') return sim.career.status === 'employed';
    if (item.id === 'contract') return Boolean(progress.activeContract);
    if (item.id === 'study-windows') return stage >= 1;
    if (item.id === 'study-web') return stage >= 2;
    return true;
  });

  const currentActionBlocked = (currentActivityId === 'work' && (!atWorkplace ? false : !canWork)) || (currentActivityId === 'maintenance' && progress.balance < 600);

  const runCurrentActivity = () => {
    if (currentActivityId === 'contract') { openApp('contracts'); return; }
    if (currentActivityId === 'work' && !atWorkplace) { openApp('city'); return; }
    if (currentActivityId === 'story') { openApp(storyTarget); return; }
    performActivity(currentActivityId);
  };


  return (
    <div className="life-app">
      <aside className="life-sidebar">
        <header>
          <div className="life-avatar">ИВ</div>
          <div><strong>Илья Воронцов</strong><span>{city.name} · день {sim.clock.day}</span></div>
        </header>
        <nav>{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><Icon size={17} /><span>{item.label}</span><ChevronRight size={14} /></button>; })}</nav>
        <footer>
          <span>БАНК</span>
          <strong>{progress.balance.toLocaleString('ru-RU')} ₽</strong>
          <small>{sim.career.status === 'employed' ? sim.career.title : 'Нет постоянного дохода'}</small>
        </footer>
      </aside>

      <main className="life-main app-scroll">
        <header className="life-topbar">
          <div><p className="eyebrow">КАЛЕНДАРЬ / ОСТРОГОРСК</p><h2>{tabs.find((item) => item.id === tab)?.label}</h2></div>
          <div className="life-clock"><CalendarDays size={17} /><div><strong>{formatDate(sim.clock.dateIso)}</strong><span>{periodLabels[sim.clock.period]}</span></div></div><button className="life-location-chip" onClick={() => openApp('city')}><MapPin size={16} /><div><strong>{currentLocation?.shortName ?? 'Острогорск'}</strong><span>Открыть карту</span></div></button>
        </header>

        {tab === 'today' && (
          <>
            <section className="daily-summary-grid">
              <article><span>Текущий период</span><strong>{periodLabels[sim.clock.period]}</strong><small>День {sim.clock.day}</small></article>
              <article><span>Свободные деньги</span><strong>{progress.balance.toLocaleString('ru-RU')} ₽</strong><small>Еда утром: −{foodPlan.dailyCost.toLocaleString('ru-RU')} ₽</small></article>
              <article><span>Работа</span><strong>{sim.career.status === 'employed' ? sim.career.title : 'Нет'}</strong><small>{isScheduledWorkPeriod(sim) ? (atWorkplace ? 'Смена должна быть закрыта сейчас' : `Нужно приехать: ${workplace?.shortName ?? 'офис'}`) : `Следующая зарплата: день ${sim.career.nextPayDay}`}</small></article>
              <article className={daysToDeadline !== null && daysToDeadline <= 0 ? 'danger' : ''}><span>Контракт</span><strong>{progress.activeContract ? `до дня ${activeDeadline}` : 'Не принят'}</strong><small>{progress.activeContract ? `${progress.activeContract.durationSlots ?? 1} период · ${daysToDeadline! < 0 ? 'просрочен' : `осталось ${daysToDeadline} дн.`}` : 'Новые заказы приходят утром'}</small></article>
            </section>

            <section className="daily-layout">
              <div className="daily-plan-panel">
                <header><div><p className="eyebrow">ПЛАН НА ДЕНЬ</p><h3>{formatDate(sim.clock.dateIso)}</h3></div><ListChecks size={23} /></header>
                <div className="daily-timeline">
                  {dayPeriods.map((period, index) => {
                    const past = index < periodIndex;
                    const current = period === sim.clock.period;
                    const done = sim.daily.completedKeys.includes(periodKey(sim.clock.day, period)) || past;
                    const fallback: DailyActivityId = period === 'workday' && sim.career.status === 'employed' ? 'work' : period === 'night' ? 'sleep' : period === sim.clock.period ? defaultActivity : 'free';
                    const selected = sim.daily.planDay === sim.clock.day ? (sim.daily.plan[period] ?? fallback) : fallback;
                    const definition = activityById(selected);
                    return <article key={period} className={`${current ? 'current' : ''} ${done ? 'done' : ''}`}>
                      <div className="daily-period-mark"><span>{index + 1}</span><i /></div>
                      <div className="daily-period-copy"><strong>{periodLabels[period]}</strong><small>{done ? 'Завершено' : current ? 'Сейчас' : 'Запланировано'}</small></div>
                      <select disabled={done} value={selected} onChange={(event) => setDayPlan(period, event.target.value as DailyActivityId)}>
                        {activityOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                      <p>{definition.description}</p>
                      {current && <button className="primary-action compact" disabled={currentActionBlocked} onClick={runCurrentActivity}><Play size={14} />{definition.kind === 'navigation' ? 'Открыть' : 'Выполнить'}</button>}
                    </article>;
                  })}
                </div>
              </div>

              <aside className="daily-side-column">
                <article className="daily-current-card">
                  <header><Clock3 size={18} /><span>СЕЙЧАС</span></header>
                  <h3>{currentActivity.label}</h3>
                  <p>{currentActivity.description}</p>
                  {currentActivityId === 'work' && !canWork && <small>Рабочую смену можно закрыть в рабочий период при энергии и концентрации не ниже 25.</small>}
                  <button className="primary-action full" disabled={currentActionBlocked} onClick={runCurrentActivity}>{currentActivity.kind === 'navigation' ? 'Перейти' : 'Начать'}</button>
                </article>

                <article className="daily-story-card">
                  <header><BookOpenCheck size={18} /><span>ОСНОВНОЕ ДЕЛО</span></header>
                  <h3>{storyLabel}</h3>
                  <p>Задача доступна. Можно вернуться к ней после смены или текущего заказа.</p>
                  <button className="secondary-action full" onClick={() => openApp(storyTarget)}>Продолжить</button>
                </article>

                <article className="daily-deadlines-card">
                  <header><FileClock size={18} /><span>БЛИЖАЙШИЕ СРОКИ</span></header>
                  <div><strong>Аренда</strong><span>день {sim.housing.nextRentDay}</span></div>
                  <div><strong>Зарплата</strong><span>{sim.career.status === 'employed' ? `день ${sim.career.nextPayDay}` : 'нет работы'}</span></div>
                  <div><strong>Контракт</strong><span>{activeDeadline ? `день ${activeDeadline}` : 'нет'}</span></div>
                  <div><strong>Пропущено смен</strong><span>{sim.daily.missedShifts}</span></div>
                </article>
              </aside>
            </section>

            {dailyEvent && sim.daily.event && !sim.daily.event.resolvedChoiceId && (
              <section className="daily-event-card">
                <div><AlertTriangle size={23} /><span>СОБЫТИЕ ДНЯ</span></div>
                <h3>{dailyEvent.title}</h3>
                <p>{dailyEvent.text}</p>
                <footer>{dailyEvent.choices.map((choice) => <button key={choice.id} onClick={() => resolveDayEvent(choice.id)}>{choice.label}</button>)}</footer>
              </section>
            )}

            {dailyEvent && sim.daily.event?.resolvedChoiceId && (
              <section className="daily-event-card resolved"><div><Check size={20} /><span>СОБЫТИЕ ЗАКРЫТО</span></div><h3>{dailyEvent.title}</h3><p>{dailyEvent.choices.find((choice) => choice.id === sim.daily.event?.resolvedChoiceId)?.result}</p></section>
            )}
          </>
        )}

        {tab === 'overview' && (
          <>
            <section className="life-status-grid">
              {[
                { label: 'Энергия', value: sim.needs.energy, icon: Coffee, inverse: false },
                { label: 'Стресс', value: sim.needs.stress, icon: Gauge, inverse: true },
                { label: 'Здоровье', value: sim.needs.health, icon: HeartPulse, inverse: false },
                { label: 'Концентрация', value: sim.needs.focus, icon: Activity, inverse: false },
              ].map((card) => { const Icon = card.icon; return <article key={card.label} className={meterClass(card.value, card.inverse)}><header><Icon size={18} /><span>{card.label}</span><strong>{card.value}</strong></header><div><i style={{ width: `${card.value}%` }} /></div></article>; })}
            </section>

            <section className="life-overview-grid">
              <article className="life-panel current-place">
                <header><Home size={18} /><span>Сейчас</span></header>
                <h3>{housing.name}</h3>
                <p>{housing.description}</p>
                <dl><div><dt>Интернет</dt><dd>{housing.internet}/3</dd></div><div><dt>Приватность</dt><dd>{housing.privacy}/3</dd></div><div><dt>Следующая аренда</dt><dd>день {sim.housing.nextRentDay}</dd></div></dl>
              </article>

              <article className="life-panel equipment-panel">
                <header><Cpu size={18} /><span>Рабочее место</span></header>
                <div className="equipment-grid"><div><strong>{equipment.compute}</strong><span>Вычисления</span></div><div><strong>{equipment.storage}</strong><span>Хранилище</span></div><div><strong>{equipment.network}</strong><span>Сеть</span></div><div><strong>{equipment.resilience}</strong><span>Резерв</span></div></div>
                <button className="secondary-action full" onClick={() => setTab('market')}>Открыть магазин</button>
              </article>

              <article className="life-panel budget-panel">
                <header><CreditCard size={18} /><span>Регулярные расходы</span></header>
                <dl><div><dt>Еда</dt><dd>{foodPlan.dailyCost.toLocaleString('ru-RU')} ₽ / день</dd></div><div><dt>Жильё</dt><dd>{housing.rent.toLocaleString('ru-RU')} ₽ / 30 дней</dd></div><div><dt>Доход</dt><dd>{sim.career.monthlySalary.toLocaleString('ru-RU')} ₽ / 30 дней</dd></div></dl>
                <button className="secondary-action full" onClick={() => setTab('housing')}>Изменить быт</button>
              </article>
            </section>

            <section className="life-actions">
              <button onClick={advanceTime}><Clock3 size={19} /><div><strong>Пропустить период</strong><span>Время пройдёт, энергия снизится</span></div></button>
              <button onClick={rest}><BedDouble size={19} /><div><strong>Спать до утра</strong><span>Восстановить энергию и концентрацию</span></div></button>
              <button onClick={secureDevices} disabled={progress.balance < 600}><ShieldCheck size={19} /><div><strong>Проверить устройства</strong><span>600 ₽ · один период · снизить цифровой след</span></div></button>
              <button onClick={() => setTab('career')}><BriefcaseBusiness size={19} /><div><strong>{sim.career.status === 'employed' ? 'Рабочая смена' : 'Найти работу'}</strong><span>{sim.career.status === 'employed' ? sim.career.title : 'Открыть вакансии'}</span></div></button>
            </section>

            <section className="life-panel life-events">
              <header><Activity size={18} /><span>Последние события</span></header>
              <div>{sim.events.slice(0, 8).map((entry) => <article key={entry.id}><i className={entry.type} /><div><strong>{entry.title}</strong><p>{entry.text}</p></div><time>день {entry.day} · {periodLabels[entry.period]}</time></article>)}</div>
            </section>
          </>
        )}

        {tab === 'housing' && (
          <>
            <section className="life-section-head"><div><h3>Питание</h3><p>Выбирается бюджет на день. Списание проходит утром автоматически.</p></div><Utensils size={24} /></section>
            <section className="food-plan-grid">{foodPlans.map((plan) => <button key={plan.id} className={sim.foodPlanId === plan.id ? 'active' : ''} onClick={() => setFoodPlan(plan.id as FoodPlanId)}><header><strong>{plan.name}</strong><b>{plan.dailyCost.toLocaleString('ru-RU')} ₽</b></header><p>{plan.description}</p><footer><span>Энергия +{plan.energyRecovery}</span><span>Стресс −{plan.stressRecovery}</span></footer>{sim.foodPlanId === plan.id && <Check size={17} />}</button>)}</section>

            <section className="life-section-head housing-head"><div><h3>Жильё в городе</h3><p>Переезд оплачивается сразу: первый месяц и залог.</p></div><Building2 size={24} /></section>
            <section className="housing-grid">{housingCatalog.filter((entry) => entry.cityId === sim.world.currentCityId).map((entry) => {
              const current = entry.id === sim.housing.currentHousingId;
              const locked = Boolean(entry.requirement) && entry.id === 'cash-room' && sim.reputation.underground < 6;
              const cost = entry.rent + entry.deposit;
              return <article key={entry.id} className={`${current ? 'current' : ''} ${locked ? 'locked' : ''}`}><header><div><Home size={19} /><span>{current ? 'ТЕКУЩЕЕ' : 'ДОСТУПНО'}</span></div><strong>{entry.rent.toLocaleString('ru-RU')} ₽/мес.</strong></header><h3>{entry.name}</h3><p>{entry.description}</p><div className="housing-stats"><span>Защита {entry.security}/3</span><span>Приватность {entry.privacy}/3</span><span>Интернет {entry.internet}/3</span><span>Место {entry.workspace}/3</span></div>{entry.requirement && <small>{entry.requirement}</small>}<footer><div><span>Въезд</span><strong>{cost.toLocaleString('ru-RU')} ₽</strong></div><button disabled={current || locked || progress.balance < cost} onClick={() => changeHousing(entry.id)}>{current ? 'Живёшь здесь' : 'Переехать'}</button></footer></article>;
            })}</section>
          </>
        )}

        {tab === 'market' && (
          <>
            <section className="life-section-head"><div><h3>Техника</h3><p>Покупки остаются в инвентаре и будут ограничивать будущие лаборатории и операции.</p></div><ShoppingBag size={24} /></section>
            <section className="store-grid">{storeItems.map((item) => { const Icon = itemIcon(item.category); const has = owned.has(item.id); return <article key={item.id} className={has ? 'owned' : ''}><header><span><Icon size={22} /></span><b>{item.category.toUpperCase()}</b></header><h3>{item.name}</h3><p>{item.description}</p><div>{item.bonuses.map((bonus) => <small key={bonus}><Check size={12} />{bonus}</small>)}</div><small className="store-location-note"><MapPin size={11} />{item.sellerLocationIds.includes(sim.world.currentLocationId) ? (currentLocation && isLocationOpen(currentLocation, sim.clock.period) ? 'Доступно здесь' : 'Магазин закрыт') : 'Нужно приехать в магазин'}</small><footer><strong>{item.price.toLocaleString('ru-RU')} ₽</strong><button disabled={has || progress.balance < item.price || (item.sellerLocationIds.includes(sim.world.currentLocationId) && (!currentLocation || !isLocationOpen(currentLocation, sim.clock.period)))} onClick={() => item.sellerLocationIds.includes(sim.world.currentLocationId) ? buyItem(item.id) : openApp('city')}>{has ? 'Куплено' : item.sellerLocationIds.includes(sim.world.currentLocationId) ? 'Купить' : 'Открыть City'}</button></footer></article>; })}</section>
            <section className="life-panel inventory-panel"><header><PackageCheck size={18} /><span>Инвентарь</span></header><div>{sim.inventory.map((entry) => { const item = storeItems.find((candidate) => candidate.id === entry.itemId); return <span key={entry.itemId}>{item?.name ?? (entry.itemId === 'old-pc' ? 'Старый системный блок' : 'Основной телефон')} · {entry.condition}%</span>; })}</div></section>
          </>
        )}

        {tab === 'career' && (
          <>
            <section className="career-current">
              <div><p className="eyebrow">ТЕКУЩЕЕ ПОЛОЖЕНИЕ</p><h3>{sim.career.status === 'employed' ? sim.career.title : 'Без работы'}</h3><p>{currentJob?.employer ?? 'Можно жить с заказов, но постоянного дохода нет.'}</p></div>
              {sim.career.status === 'employed' && <div className="career-pay"><span>ЗАРПЛАТА</span><strong>{sim.career.monthlySalary.toLocaleString('ru-RU')} ₽</strong><small>следующая выплата: день {sim.career.nextPayDay}</small></div>}
            </section>

            {sim.career.status === 'employed' && <section className="career-controls"><article><span>Смены</span><strong>{sim.career.shiftsWorked}</strong></article><article><span>Результат</span><strong>{sim.career.performance}/100</strong></article><article><span>Предупреждения</span><strong>{sim.career.warnings}</strong></article><button className="primary-action" disabled={!canWork} onClick={workShift}><BriefcaseBusiness size={17} />Отработать смену</button><button className="secondary-action" onClick={() => setConfirmQuit(true)}>Уволиться</button></section>}
            {!canWork && sim.career.status === 'employed' && <div className="career-warning"><AlertTriangle size={17} />{!atWorkplace ? `Сначала доберись до точки работы: ${workplace?.name ?? 'офис'}.` : 'Перед сменой нужно восстановить энергию и концентрацию.'}</div>}

            <section className="life-section-head"><div><h3>Вакансии</h3><p>Навыки и репутация проверяются по фактически выполненным задачам.</p></div><BriefcaseBusiness size={24} /></section>
            <section className="job-grid">{jobsCatalog.map((job) => {
              const access = getJobAccess(progress, job);
              const available = access.available && job.id !== sim.career.jobId;
              const current = job.id === sim.career.jobId;
              return <article key={job.id} className={`${available ? '' : 'locked'} ${current ? 'current' : ''}`}><header><span>{job.employer}</span><strong>{job.monthlySalary.toLocaleString('ru-RU')} ₽</strong></header><h3>{job.title}</h3><p>{job.description}</p><dl><div><dt>Город</dt><dd>{cities.find((entry) => entry.id === job.cityId)?.name}</dd></div><div><dt>График</dt><dd>{job.schedule}</dd></div><div><dt>Этап</dt><dd>{job.requiredStage ?? 0}</dd></div></dl>{!access.available && <div className="job-lock-reason">{access.reasons[0]}</div>}<button disabled={!available || current || sim.career.status === 'employed'} onClick={() => acceptJob(job.id)}>{current ? 'Текущая работа' : sim.career.status === 'employed' ? 'Сначала уволься' : available ? 'Принять предложение' : 'Требования не выполнены'}</button></article>;
            })}</section>
          </>
        )}

        {tab === 'risk' && (
          <>
            <section className={`wanted-card level-${sim.heat.wantedLevel}`}><div><ShieldAlert size={32} /><span>УРОВЕНЬ РОЗЫСКА</span></div><strong>{sim.heat.wantedLevel}</strong><p>{heatText(sim.heat.wantedLevel)}</p></section>
            <section className="risk-grid">
              {[
                ['Цифровой след', sim.heat.digitalTrace, 'IP, аккаунты, журналы и повторяющиеся методы.'],
                ['Подозрение компании', sim.heat.corporateSuspicion, 'Необычные запросы, копирование данных и доступ не по должности.'],
                ['Интерес органов', sim.heat.lawAttention, 'Связанные события, контакты и официальные проверки.'],
                ['Криминальная известность', sim.heat.criminalExposure, 'Кто знает псевдонимы, заказчиков и слабые места Ильи.'],
              ].map(([label, value, text]) => <article key={label as string}><header><span>{label as string}</span><strong>{value as number}/100</strong></header><div><i style={{ width: `${value}%` }} /></div><p>{text as string}</p></article>)}
            </section>
            <section className="life-panel risk-actions"><header><ShieldCheck size={18} /><span>Доступное действие</span></header><h3>Проверить свои устройства</h3><p>Обновить пароли, закрыть старые сессии, проверить резервную копию и список активных устройств.</p><button className="primary-action" disabled={progress.balance < 600} onClick={secureDevices}>600 ₽ · один период</button></section>
            <section className="life-panel reputation-panel"><header><Gauge size={18} /><span>Репутация</span></header><div><span><b>{sim.reputation.professional}</b>Профессиональная</span><span><b>{sim.reputation.reliability}</b>Надёжность</span><span><b>{sim.reputation.underground}</b>Подпольная</span><span><b>{sim.reputation.notoriety}</b>Известность</span></div></section>
          </>
        )}
      </main>

      {confirmQuit && <div className="life-modal-layer"><div className="life-modal"><button onClick={() => setConfirmQuit(false)}><X size={18} /></button><BriefcaseBusiness size={30} /><h3>Уволиться?</h3><p>Постоянная зарплата пропадёт. Вернуться в эту компанию получится только через новую вакансию или сюжет.</p><div><button className="secondary-action" onClick={() => setConfirmQuit(false)}>Отмена</button><button className="primary-action" onClick={() => { quitJob(); setConfirmQuit(false); }}>Уволиться</button></div></div></div>}
    </div>
  );
}
