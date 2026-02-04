import { useEffect, useState } from "react";

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

export function useClock(initialSeconds: [number, number]) {
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

      // まだ開始していない
      if (prev.active === null) {
        next.active = player === 0 ? 1 : 0;
        next.running = true;
        next.lastTs = now;
        return next;
      }

      // 進行中
      const nextActive = player === 0 ? 1 : 0;

      if (nextActive !== prev.active) {
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
