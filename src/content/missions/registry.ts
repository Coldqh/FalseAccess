import type { MissionDefinition } from '../../core/scenario/types';
import { validateMissionDefinition } from '../../core/scenario/validation';
import { workspace01Definition } from './workspace01/definition';
import { clinic01Definition } from './clinic01/definition';
import { logs01Definition } from './logs01/definition';

const definitions = [workspace01Definition, logs01Definition, clinic01Definition] as const;

export const missionRegistry: Readonly<Record<string, MissionDefinition>> = Object.freeze(
  Object.fromEntries(definitions.map((definition) => {
    const validation = validateMissionDefinition(definition);
    if (!validation.valid) throw new Error(`Invalid mission ${definition.id}: ${validation.errors.join(' | ')}`);
    return [definition.id, definition];
  })),
);

export function getMissionDefinition(id: string): MissionDefinition | null {
  return missionRegistry[id] ?? null;
}
