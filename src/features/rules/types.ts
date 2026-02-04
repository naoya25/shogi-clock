export type ClockConfigV1 = {
  version: 1;
  name: string;
  time: {
    player1: {
      mainSeconds: number;
      byoyomiSeconds?: number;
      fischerSeconds?: number;
    };
    player2: {
      mainSeconds: number;
      byoyomiSeconds?: number;
      fischerSeconds?: number;
    };
  };
  audio: {
    announceMinutes: number[];
    announceSeconds: number[];
    countdownFrom: number;
  };
};
