// Talent IDs
export type FaucetTalentId = "faucetAmountBoost" | "faucetCooldownReduction" | "faucetDoubleClaim";
export type LeverageTalentId = "leverageBoostSmall" | "leverageBoostLarge" | "liquidationSave";
export type TalentId = FaucetTalentId | LeverageTalentId;

// Single talent info
export interface TalentInfo {
  id: TalentId;
  name: string;
  description: string;
  maxPoints: number;
  currentPoints: number;
  tier: number;
  tree: "faucet" | "leverage";
  isUnlocked: boolean;
  requires: TalentId | null;
  requiresPoints: number;
  prerequisiteMet: boolean;
}

// Full talent tree response
export interface TalentTreeResponse {
  faucetTree: TalentInfo[];
  leverageTree: TalentInfo[];
  totalPointsSpent: number;
  availablePoints: number;
  userLevel: number;
}

// Talent config (public endpoint)
export interface TalentConfig {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  tier: number;
  tree: string;
  requires: string | null;
  requiresPoints: number;
  bonusPerPoint: number | null;
}

export interface TalentConfigResponse {
  talents: TalentConfig[];
}

// Allocate talent response
export interface AllocateTalentResponse {
  success: boolean;
  message: string;
  talentTree: TalentTreeResponse;
}

// Reset talents response
export interface ResetTalentsResponse {
  success: boolean;
  message: string;
  talentTree: TalentTreeResponse;
}

// Bonuses response
export interface TalentBonusesResponse {
  faucet: {
    amountMultiplier: number;
    amountBonus: string;
    cooldownMultiplier: number;
    cooldownReduction: string;
    claimsPerCooldown: number;
  };
  leverage: {
    maxLeverageBonus: number;
    maxLeverageBonusDisplay: string;
    hasLiquidationSave: boolean;
    liquidationSaveAvailable: boolean;
    lastLiquidationSaveAt: string | null;
  };
}

// Tree type
export type TalentTreeType = "faucet" | "leverage";

// Talent tree metadata for UI
export interface TalentTreeMeta {
  id: TalentTreeType;
  name: string;
  icon: string;
  description: string;
  color: string;
  glowColor: string;
}

export const TALENT_TREES: Record<TalentTreeType, TalentTreeMeta> = {
  faucet: {
    id: "faucet",
    name: "Fortune",
    icon: "droplet",
    description: "Enhance your faucet rewards",
    color: "#00d4aa",
    glowColor: "rgba(0, 212, 170, 0.5)",
  },
  leverage: {
    id: "leverage",
    name: "Power",
    icon: "sword",
    description: "Amplify your trading might",
    color: "#f5a623",
    glowColor: "rgba(245, 166, 35, 0.5)",
  },
};
