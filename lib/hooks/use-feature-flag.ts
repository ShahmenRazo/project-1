"use client";

import { useSyncExternalStore } from "react";

/**
 * Feature flags для текущего пользователя.
 * Загружаются один раз через GET /api/features (оценка target + rollout
 * происходит серверно — детерминированный hash user_id + flag_name),
 * кэшируются на уровне модуля на 60 секунд.
 */

type FlagMap = Record<string, boolean>;

let cache: FlagMap | null = null;
let inflight: Promise<FlagMap> | null = null;
let expiresAt = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!inflight && (!cache || Date.now() > expiresAt)) {
    inflight = load()
      .then((flags) => {
        cache = flags;
        expiresAt = Date.now() + 60_000;
        return flags;
      })
      .catch(() => {
        cache = cache ?? {};
        return cache;
      })
      .finally(() => {
        inflight = null;
        emit();
      });
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): FlagMap | null {
  return cache;
}

async function load(): Promise<FlagMap> {
  const res = await fetch("/api/features", { cache: "no-store" });
  if (!res.ok) return {};
  const json = (await res.json()) as { data: { features: FlagMap } };
  return json.data.features;
}

/** Проверка конкретного флага: useFeatureFlag("new_dashboard") */
export function useFeatureFlag(name: string): boolean {
  const flags = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return flags?.[name] ?? false;
}

/** Все флаги разом (для отладки/демо) */
export function useFeatureFlags(): FlagMap {
  const flags = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return flags ?? {};
}
