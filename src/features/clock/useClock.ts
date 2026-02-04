import { useEffect, useState } from "react";
import type { ClockConfigV1 } from "../rules/types";

const TICK_MS = 100;

type PlayerState = {
  remainingMs: number;
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
  const initialSeconds: [number, number] = [
    time.player1.mainSeconds,
    time.player2.mainSeconds,
  ];
  // const byoyomiSeconds: [number, number] = [
  //   time.player1.byoyomiSeconds ?? 0,
  //   time.player2.byoyomiSeconds ?? 0,
  // ];
  const fischerSeconds: [number, number] = [
    time.player1.fischerSeconds ?? 0,
    time.player2.fischerSeconds ?? 0,
  ];

  const [state, setState] = useState<ClockState>(() => ({
    players: [
      { remainingMs: initialSeconds[0] * 1000 },
      { remainingMs: initialSeconds[1] * 1000 },
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

        const p = next.players[next.active!];
        p.remainingMs -= delta;

        if (p.remainingMs <= 0) {
          p.remainingMs = 0;
          next.running = false;
          next.finished = true;
        }

        return next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [state.running, state.finished, state.active]);

  function tap(player: 0 | 1) {
    setState((prev) => {
      if (prev.finished) return prev;

      const now = Date.now();
      const next = structuredClone(prev);

      // タップ瞬間までの経過分を反映（最後のtickとtapの間のズレを減らす）
      if (prev.running && prev.active !== null && prev.lastTs !== null) {
        const delta = now - prev.lastTs;
        const p = next.players[prev.active];
        p.remainingMs -= delta;
        if (p.remainingMs <= 0) {
          p.remainingMs = 0;
          next.running = false;
          next.finished = true;
          next.lastTs = null;
          return next;
        }
      }

      // まだ開始していない
      if (prev.active === null) {
        // ゲーム開始の最初のタップではフィッシャー増分は加算しない
        next.active = player === 0 ? 1 : 0;
        next.running = true;
        next.lastTs = now;
        return next;
      }

      // 進行中
      const nextActive = player === 0 ? 1 : 0;

      if (nextActive !== prev.active) {
        const incMs = (fischerSeconds[player] ?? 0) * 1000;
        if (incMs > 0) next.players[player].remainingMs += incMs;
        next.active = nextActive;
        next.lastTs = now;
      }

      return next;
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
