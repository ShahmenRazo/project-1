import crypto from "crypto";

export type FeatureTarget = "all" | "pro_only" | "beta_users";

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout_percent: number;
  target: FeatureTarget;
  created_at: string;
}

export type FeatureFlagMap = Record<string, boolean>;

export interface FeatureUserContext {
  id: string | null;
  subscription_tier: string | null;
  is_beta: boolean;
}

/**
 * Детерминированное «сворачивание» rollout-процента: один и тот же пользователь
 * всегда попадает в одну и ту же группу для конкретного флага (стабильно между
 * перезагрузками и рендерами, в отличие от random()).
 */
export function rolloutPasses(
  flagName: string,
  userId: string | null,
  percent: number
): boolean {
  if (percent >= 100) return true;
  if (percent <= 0 || !userId) return false;
  const digest = crypto.createHash("sha256").update(`${userId}:${flagName}`).digest();
  const bucket = digest.readUInt32BE(0) % 100;
  return bucket < percent;
}

/** Проверка target-аудитории */
export function targetPasses(target: FeatureTarget, user: FeatureUserContext): boolean {
  switch (target) {
    case "all":
      return true;
    case "pro_only":
      return user.subscription_tier === "pro";
    case "beta_users":
      return user.is_beta;
  }
}

/** Итоговая проверка одного флага для пользователя */
export function flagEnabledFor(
  flag: Pick<FeatureFlag, "name" | "enabled" | "rollout_percent" | "target">,
  user: FeatureUserContext
): boolean {
  if (!flag.enabled) return false;
  if (!targetPasses(flag.target, user)) return false;
  return rolloutPasses(flag.name, user.id, flag.rollout_percent);
}

/** Свёртка списка флагов в карту name → boolean */
export function evaluateFlags(
  flags: Pick<FeatureFlag, "name" | "enabled" | "rollout_percent" | "target">[],
  user: FeatureUserContext
): FeatureFlagMap {
  const map: FeatureFlagMap = {};
  for (const f of flags) map[f.name] = flagEnabledFor(f, user);
  return map;
}
