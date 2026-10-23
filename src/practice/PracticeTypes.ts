import { Player } from '../player/Player';
import { TrackManager } from '../track/TrackManager';

export type PracticeModuleId =
  | 'THREE_LANE_MOVEMENT'
  | 'JUMP_TIMING'
  | 'SLIDE_TIMING'
  | 'FAST_DROP'
  | 'JUMP_AND_LANE_SWITCH'
  | 'RAMP_CLIMBING'
  | 'TRAIN_ROOFTOP_LANDING'
  | 'TRAIN_ROOF_TRANSFER'
  | 'MOVING_TRAIN_AVOIDANCE'
  | 'HOVERBOARD_AND_POWERUPS';

export type PracticeResult = 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';

export type PracticeMedal = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

export interface PracticeEvaluation {
  result: PracticeResult;
  message: string;
  tip?: string;
  progressCurrent?: number;
  progressTarget?: number;
}

export interface PracticeModuleDef {
  id: PracticeModuleId;
  title: string;
  subtitle: string;
  icon: string;
  skillCategory: 'BASIC_LOCOMOTION' | 'OBSTACLE_CLEARANCE' | 'ADVANCED_TECH' | 'TRAIN_NAVIGATION';
  instructions: string;
  controlsHint: string;
  objectiveText: string;
  harderVariationLabel: string;
  setup(player: Player, trackManager: TrackManager, isHarder: boolean): void;
  evaluate(player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation;
}

export interface PracticeProgressRecord {
  completed: boolean;
  medal: PracticeMedal;
  harderCompleted: boolean;
  attempts: number;
  lastAttemptDate: string;
}
