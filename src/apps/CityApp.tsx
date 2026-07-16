import { useMemo, useState } from 'react';
import {
  Banknote, BriefcaseBusiness, Bus, Check, Clock3, Coffee, Footprints, Home, Map, MapPin,
  Navigation, PackageCheck, Route, ShoppingBag, Store, TrainFront, UserRound, X,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import { jobsCatalog, periodLabels, storeItems } from '../simulation/catalog';
import {
  calculateTravelRoute, cityLocations, getCityLocation, isLocationOpen, ostrogorskDistricts, travelModes,
  type CityLocationDefinition,
} from '../simulation/city';
import { isScheduledWorkPeriod } from '../simulation/daily';
import type { AppId } from '../types';
import type { TravelModeId } from '../simulation/types';

function locationIcon(kind: CityLocationDefinition['kind']) {
  if (kind === 'home') return Home;
  if (kind === 'office') return BriefcaseBusiness;
  if (kind === 'shop') return Store;
  if (kind === 'food') return Coffee;
  if (kind === 'transport') return TrainFront;
  if (kind === 'service') return Banknote;
  return MapPin;
}

function periodHours(location: CityLocationDefinition) {
  if (location.openPeriods.length === 4) return 'Круглосуточно';
  return location.openPeriods.map((period) => periodLabels[period]).join(' · ');
}

export function CityApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress, travelTo, buyItem, workShift, rest, completeCityScene } = useProgress();
  const sim = progress.simulation;
  const current = getCityLocation(sim.world.currentLocationId) ?? cityLocations[0];
  const locations = cityLocations.filter((location) => location.cityId === sim.world.currentCityId);
  const [selectedId, setSelectedId] = useState(current.id);
  const [modeId, setModeId] = useState<TravelModeId>('bus');
  const [filter, setFilter] = useState<'all' | CityLocationDefinition['kind']>('all');
  const selected = getCityLocation(selectedId) ?? current;
  const selectedOpen = isLocationOpen(selected, sim.clock.period);
  const currentJob = jobsCatalog.find((job) => job.id === sim.career.jobId);
  const route = calculateTravelRoute(current.id, selected.id, modeId);
  const storeStock = storeItems.filter((item) => item.sellerLocationIds.includes(current.id));
  const owned = new Set(sim.inventory.map((entry) => entry.itemId));
  const canWorkHere = Boolean(
    currentJob
    && (currentJob.remote || currentJob.locationId === current.id)
    && isScheduledWorkPeriod(sim)
    && selectedOpen
    && sim.needs.energy >= 25
    && sim.needs.focus >= 20,
  );

  const scene = useMemo(() => {
    if (current.id === 'clinic-4' && progress.clinicWrapupComplete && !sim.world.citySceneIds.includes('clinic-maxim')) {
      return {
        id: 'clinic-maxim',
        name: 'Максим Белов',
        lines: [
          '— Зашёл всё-таки. Вот тот системник из регистратуры.',
          '— Диск я снял. Остальное можешь посмотреть, только провода обратно воткни.',
        ],
        action: 'Осмотреть рабочее место',
      };
    }
    if (current.id === 'signal-cafe' && progress.firstShiftComplete && progress.criminalContactResponse === 'interested' && !sim.world.citySceneIds.includes('igor-cafe')) {
      return {
        id: 'igor-cafe',
        name: 'Игорь',
        lines: [
          '— Ты Илья? Садись.',
          '— Вот копия. Внутри сайт, access, sessions и audit.',
          '— Нужны IP, время и учётка. За лишнее не плачу.',
        ],
        action: 'Забрать архив',
      };
    }
    return null;
  }, [current.id, progress.clinicWrapupComplete, progress.firstShiftComplete, progress.criminalContactResponse, sim.world.citySceneIds]);

  const visibleLocations = filter === 'all' ? locations : locations.filter((location) => location.kind === filter);

  return (
    <div className="city-app">
      <aside className="city-sidebar">
        <header>
          <div><p className="eyebrow">ГОРОД / ДЕНЬ {sim.clock.day}</p><h2>Острогорск</h2></div>
          <Map size={24} />
        </header>

        <section className="city-current-card">
          <span>СЕЙЧАС</span>
          <strong>{current.name}</strong>
          <p>{current.address}</p>
          <small>{periodLabels[sim.clock.period]} · в дороге сегодня {sim.world.travelMinutesToday} мин.</small>
        </section>

        <div className="city-filters">
          {[
            ['all', 'Все'], ['home', 'Дом'], ['office', 'Работа'], ['shop', 'Магазины'], ['service', 'Сервисы'],
          ].map(([id, label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id as typeof filter)}>{label}</button>)}
        </div>

        <div className="city-location-list app-scroll">
          {visibleLocations.map((location) => {
            const Icon = locationIcon(location.kind);
            const open = isLocationOpen(location, sim.clock.period);
            return (
              <button key={location.id} className={`${selected.id === location.id ? 'active' : ''} ${current.id === location.id ? 'current' : ''}`} onClick={() => setSelectedId(location.id)}>
                <span><Icon size={17} /></span>
                <div><strong>{location.name}</strong><small>{location.address}</small></div>
                <i className={open ? 'open' : 'closed'}>{current.id === location.id ? 'ЗДЕСЬ' : open ? 'ОТКРЫТО' : 'ЗАКРЫТО'}</i>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="city-main">
        <section className="city-map-wrap">
          <div className="city-map-grid" />
          {ostrogorskDistricts.map((district) => (
            <div key={district.id} className={`city-district district-${district.id}`} style={{ left: `${district.x}%`, top: `${district.y}%`, width: `${district.width}%`, height: `${district.height}%` }}>
              <strong>{district.name}</strong><span>{district.description}</span>
            </div>
          ))}
          <svg className="city-roads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M12 72 C28 62, 42 42, 58 28 S80 55, 87 82" />
            <path d="M24 17 C37 30, 48 46, 74 66" />
            <path d="M18 78 C36 75, 55 75, 88 80" />
            <path d="M35 25 C49 30, 60 34, 72 34" />
          </svg>
          {locations.map((location) => {
            const Icon = locationIcon(location.kind);
            const open = isLocationOpen(location, sim.clock.period);
            return (
              <button
                key={location.id}
                className={`city-marker kind-${location.kind} ${selected.id === location.id ? 'selected' : ''} ${current.id === location.id ? 'current' : ''} ${open ? '' : 'closed'}`}
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
                onClick={() => setSelectedId(location.id)}
                title={location.name}
              >
                <span><Icon size={15} /></span><strong>{location.shortName}</strong>
              </button>
            );
          })}
          <div className="city-map-legend"><span><i className="current" />Ты здесь</span><span><i className="open" />Открыто</span><span><i className="closed" />Закрыто</span></div>
        </section>

        <section className="city-detail-panel app-scroll">
          <header>
            <div className={`city-detail-icon kind-${selected.kind}`}>{(() => { const Icon = locationIcon(selected.kind); return <Icon size={24} />; })()}</div>
            <div><p className="eyebrow">{selected.kind.toUpperCase()} / {selected.districtId}</p><h2>{selected.name}</h2><span>{selected.address}</span></div>
            <b className={selectedOpen ? 'open' : 'closed'}>{selectedOpen ? 'ОТКРЫТО' : 'ЗАКРЫТО'}</b>
          </header>
          <p className="city-description">{selected.description}</p>
          <div className="city-meta-row"><span><Clock3 size={14} />{periodHours(selected)}</span><span><MapPin size={14} />{ostrogorskDistricts.find((district) => district.id === selected.districtId)?.name}</span><span><PackageCheck size={14} />{selected.services.length} действия</span></div>
          <div className="city-services">{selected.services.map((service) => <span key={service}><Check size={12} />{service}</span>)}</div>

          {selected.id !== current.id && route && (
            <section className="route-planner">
              <header><Route size={17} /><div><strong>Маршрут</strong><span>{current.shortName} → {selected.shortName}</span></div></header>
              <div className="travel-mode-grid">
                {travelModes.map((mode) => {
                  const candidate = calculateTravelRoute(current.id, selected.id, mode.id)!;
                  const ModeIcon = mode.id === 'walk' ? Footprints : mode.id === 'bus' ? Bus : Navigation;
                  return <button key={mode.id} className={modeId === mode.id ? 'active' : ''} onClick={() => setModeId(mode.id)}><ModeIcon size={18} /><strong>{mode.name}</strong><span>{candidate.minutes} мин.</span><small>{candidate.cost ? `${candidate.cost} ₽` : 'Бесплатно'}</small></button>;
                })}
              </div>
              <button className="primary-action" disabled={progress.balance < route.cost} onClick={() => travelTo(selected.id, modeId)}><Navigation size={16} />Поехать · {route.minutes} мин. · {route.cost} ₽</button>
              <small>Каждые 120 минут поездок двигают игровой период. Знакомые маршруты сохраняются.</small>
            </section>
          )}

          {selected.id === current.id && (
            <section className="location-actions">
              <header><MapPin size={17} /><strong>Доступно здесь</strong></header>
              {current.kind === 'home' && <button className="secondary-action" onClick={rest}><Home size={16} />Спать до утра</button>}
              {currentJob && (currentJob.remote || currentJob.locationId === current.id) && <button className="primary-action" disabled={!canWorkHere} onClick={workShift}><BriefcaseBusiness size={16} />{isScheduledWorkPeriod(sim) ? 'Начать смену' : 'Смена не сейчас'}</button>}
              {current.kind === 'shop' && !selectedOpen && <p>Магазин закрыт. Вернись в другой период.</p>}
              {current.kind === 'shop' && selectedOpen && storeStock.length === 0 && <p>Подходящего товара пока нет.</p>}
              {current.kind === 'shop' && selectedOpen && storeStock.map((item) => <div className="city-stock-row" key={item.id}><div><strong>{item.name}</strong><span>{item.price.toLocaleString('ru-RU')} ₽</span></div><button disabled={owned.has(item.id) || progress.balance < item.price} onClick={() => buyItem(item.id)}>{owned.has(item.id) ? 'Куплено' : 'Купить'}</button></div>)}
              {current.kind === 'food' && <button className="secondary-action" onClick={() => openApp('life')}><Coffee size={16} />Открыть питание</button>}
              {current.kind === 'transport' && <button className="secondary-action" disabled><TrainFront size={16} />Москва пока закрыта</button>}
              {current.kind === 'service' && current.id !== 'clinic-4' && <button className="secondary-action" onClick={() => openApp('life')}><ShoppingBag size={16} />Открыть доступные услуги</button>}
            </section>
          )}

          {selected.id === current.id && scene && (
            <section className="city-story-scene">
              <header><UserRound size={18} /><strong>{scene.name}</strong><button onClick={() => completeCityScene(scene.id)}><X size={15} /></button></header>
              {scene.lines.map((line) => <p key={line}>{line}</p>)}
              <button className="primary-action" onClick={() => completeCityScene(scene.id)}>{scene.action}</button>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
