import type { MissionDefinition } from '../../core/scenario/types';
import { validateMissionDefinition } from '../../core/scenario/validation';
import { workspace01Definition } from './workspace01/definition';
import { clinic01Definition } from './clinic01/definition';
import { logs01Definition } from './logs01/definition';
import { act0ContractDefinitions } from '../contracts/act0/definitions';
import { foundationCheck01Definition } from './foundationCheck01/definition';
import { sferaOrientation01Definition } from './sferaOrientation01/definition';
import { act1ContractDefinitions } from '../contracts/act1/definitions';
import { sferaShiftCheck01Definition } from './sferaShiftCheck01/definition';
import { marshrutInvestigation01Definition } from './marshrutInvestigation01/definition';
import { act2ContractDefinitions } from '../contracts/act2/definitions';
import { marshrutCheck01Definition } from './marshrutCheck01/definition';

const definitions = [
  workspace01Definition,
  logs01Definition,
  clinic01Definition,
  ...act0ContractDefinitions,
  foundationCheck01Definition,
  sferaOrientation01Definition,
  ...act1ContractDefinitions,
  sferaShiftCheck01Definition,
  marshrutInvestigation01Definition,
  ...act2ContractDefinitions,
  marshrutCheck01Definition,
] as const;

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
