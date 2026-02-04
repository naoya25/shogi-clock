import { useCallback, useEffect, useState } from "react";
import type { ClockConfigV1 } from "../rules/types";

const TICK_MS = 100;

type PlayerState = {
  mainRemainingMs: number;
  byoyomiRemainingMs: number;
  remainingMs: number;
  inByoyomi: boolean;
};

type ClockState = {
  players: [PlayerState, PlayerState];
  active: 0 | 1 | null;
  running: boolean;
  lastTs: number | null;
  finished: boolean;
};

export type ClockTime = ClockConfigV1["time"];

export function useClock(time: ClockTime) {
  const byoyomiMs0 = (time.player1.byoyomiSeconds ?? 0) * 1000;
  const byoyomiMs1 = (time.player2.byoyomiSeconds ?? 0) * 1000;
  const fischerIncMs0 = (time.player1.fischerSeconds ?? 0) * 1000;
  const fischerIncMs1 = (time.player2.fischerSeconds ?? 0) * 1000;

  const syncDerived = useCallback(
    (next: ClockState): ClockState => {
      for (const [idx, p] of next.players.entries()) {
        const byoyomiMs = idx === 0 ? byoyomiMs0 : byoyomiMs1;
        const hasByoyomi = byoyomiMs > 0;
        p.inByoyomi = p.mainRemainingMs === 0 && hasByoyomi;
        p.remainingMs =
          p.mainRemainingMs > 0 ? p.mainRemainingMs : p.byoyomiRemainingMs;
      }
      return next;
    },
    [byoyomiMs0, byoyomiMs1],
  );

  const applyDelta = useCallback(
    (next: ClockState, player: 0 | 1, deltaMs: number): void => {
      const p = next.players[player];
      const byoyomiMs = player === 0 ? byoyomiMs0 : byoyomiMs1;

      if (p.mainRemainingMs > 0) {
        p.mainRemainingMs -= deltaMs;

        // mainを使い切った場合、余ったdeltaを秒読みへ
        if (p.mainRemainingMs <= 0) {
          const overshoot = -p.mainRemainingMs;
          p.mainRemainingMs = 0;

          if (byoyomiMs > 0) {
            // 秒読みは「手番ごとにリセット」なので、手番開始時にフルにセットされている想定。
            // 念のため0以下ならフルに戻してから減算する。
            if (p.byoyomiRemainingMs <= 0) p.byoyomiRemainingMs = byoyomiMs;
            p.byoyomiRemainingMs -= overshoot;
            if (p.byoyomiRemainingMs <= 0) {
              p.byoyomiRemainingMs = 0;
              next.running = false;
              next.finished = true;
              next.lastTs = null;
            }
          } else {
            next.running = false;
            next.finished = true;
            next.lastTs = null;
          }
        }
        return;
      }

      // mainが0なら秒読み（設定がない場合は即終了扱い）
      if (byoyomiMs <= 0) {
        next.running = false;
        next.finished = true;
        next.lastTs = null;
        return;
      }

      p.byoyomiRemainingMs -= deltaMs;
      if (p.byoyomiRemainingMs <= 0) {
        p.byoyomiRemainingMs = 0;
        next.running = false;
        next.finished = true;
        next.lastTs = null;
      }
    },
    [byoyomiMs0, byoyomiMs1],
  );

  const [state, setState] = useState<ClockState>(() => ({
    players: [
      {
        mainRemainingMs: time.player1.mainSeconds * 1000,
        byoyomiRemainingMs: byoyomiMs0,
        remainingMs: time.player1.mainSeconds * 1000,
        inByoyomi: false,
      },
      {
        mainRemainingMs: time.player2.mainSeconds * 1000,
        byoyomiRemainingMs: byoyomiMs1,
        remainingMs: time.player2.mainSeconds * 1000,
        inByoyomi: false,
      },
    ],
    active: null,
    running: false,
    lastTs: null,
    finished: false,
  }));

  // tick loop
  useEffect(() => {
    if (!state.running || state.finished) return;

    const id = setInterval(() => {
      setState((prev) => {
        if (!prev.running || prev.active === null || prev.finished) {
          return prev;
        }

        const now = Date.now();
        const last = prev.lastTs ?? now;
        const delta = now - last;

        const next = structuredClone(prev);
        next.lastTs = now;

        applyDelta(next, next.active!, delta);
        return syncDerived(next);
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [state.running, state.finished, state.active, applyDelta, syncDerived]);

  function tap(player: 0 | 1) {
    setState((prev) => {
      if (prev.finished) return prev;

      const now = Date.now();
      const next = structuredClone(prev);

      // タップ瞬間までの経過分を反映（最後のtickとtapの間のズレを減らす）
      if (prev.running && prev.active !== null && prev.lastTs !== null) {
        const delta = now - prev.lastTs;
        applyDelta(next, prev.active, delta);
        if (next.finished) return syncDerived(next);
      }

      // まだ開始していない
      if (prev.active === null) {
        // ゲーム開始の最初のタップではフィッシャー増分は加算しない
        next.active = player === 0 ? 1 : 0;
        next.running = true;
        next.lastTs = now;
        // 秒読みは手番が回ってくるごとにフル付与
        if (
          next.active !== null &&
          next.players[next.active].mainRemainingMs === 0
        ) {
          next.players[next.active].byoyomiRemainingMs =
            next.active === 0 ? byoyomiMs0 : byoyomiMs1;
        }
        return syncDerived(next);
      }

      // 進行中
      const nextActive = player === 0 ? 1 : 0;

      if (nextActive !== prev.active) {
        const incMs = player === 0 ? fischerIncMs0 : fischerIncMs1;
        // フィッシャー増分は「持ち時間」に加算する
        if (incMs > 0) next.players[player].mainRemainingMs += incMs;
        // 秒読みは持ち越さない
        const byoyomiMs = player === 0 ? byoyomiMs0 : byoyomiMs1;
        if (byoyomiMs > 0) {
          next.players[player].byoyomiRemainingMs = byoyomiMs;
        }
        next.active = nextActive;
        next.lastTs = now;
        // 新しい手番が秒読み状態なら、手番開始時にフル付与
        const nextByoyomiMs = nextActive === 0 ? byoyomiMs0 : byoyomiMs1;
        if (
          next.players[nextActive].mainRemainingMs === 0 &&
          nextByoyomiMs > 0
        ) {
          next.players[nextActive].byoyomiRemainingMs = nextByoyomiMs;
        }
      }

      return syncDerived(next);
    });
  }

  function pause() {
    setState((prev) => {
      if (!prev.running) return prev;
      return { ...prev, running: false, lastTs: null };
    });
  }

  function resume() {
    setState((prev) => {
      if (prev.running || prev.finished || prev.active === null) return prev;
      return { ...prev, running: true, lastTs: Date.now() };
    });
  }

  return { state, tap, pause, resume };
}
