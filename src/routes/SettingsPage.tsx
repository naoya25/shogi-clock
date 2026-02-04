import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { appPath } from "../routes";
import { getAllConfigs } from "../features/rules/load";
import { useMemo, useState } from "react";
import type { ClockConfigV1 } from "../features/rules/types";
import {
  ANNOUNCE_ALLOWED_COUNTDOWN_MAX,
  ANNOUNCE_ALLOWED_MINUTES_LIST,
  ANNOUNCE_ALLOWED_SECONDS_LIST,
  validateConfigV1,
} from "../features/rules/validate";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const allConfigs = useMemo(() => getAllConfigs(), []);
  const initialRuleId = useMemo(() => {
    const fromQuery = searchParams.get("rule");
    if (fromQuery && allConfigs.some((c) => c.id === fromQuery))
      return fromQuery;
    return allConfigs[0]?.id ?? "";
  }, [allConfigs, searchParams]);

  const [ruleId, setRuleId] = useState<string>(initialRuleId);

  const stateCustomConfig = (location.state as { customConfig?: unknown } | null)
    ?.customConfig;
  const initialCustom = useMemo(() => {
    if (!stateCustomConfig) return null;
    try {
      return validateConfigV1(stateCustomConfig);
    } catch {
      return null;
    }
  }, [stateCustomConfig]);

  const [ruleSource, setRuleSource] = useState<"builtin" | "custom">(
    initialCustom ? "custom" : "builtin",
  );

  const [customForm, setCustomForm] = useState<CustomRuleFormState>(() =>
    initialCustom ? fromConfigToForm(initialCustom) : defaultCustomForm(),
  );
  const [customError, setCustomError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <main className="mt-4 space-y-4">
        <section className="rounded-xl border border-gray-700 p-4 space-y-3">
          <h2 className="font-semibold">ルール</h2>

          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="rule-source"
                checked={ruleSource === "builtin"}
                onChange={() => setRuleSource("builtin")}
              />
              既存ルールから選ぶ
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="rule-source"
                checked={ruleSource === "custom"}
                onChange={() => setRuleSource("custom")}
              />
              自分で入力する（保存なし）
            </label>
          </div>

          {ruleSource === "builtin" ? (
            <div className="space-y-2">
              <label className="text-xs opacity-80" htmlFor="builtin-rule">
                既存ルール
              </label>
              <select
                id="builtin-rule"
                className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm"
                value={ruleId}
                onChange={(e) => setRuleId(e.target.value)}
              >
                {allConfigs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.config.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <CustomRuleEditor
              value={customForm}
              onChange={setCustomForm}
              errorMessage={customError}
              onClearError={() => setCustomError(null)}
            />
          )}
        </section>

        <button
          className="w-full rounded-md bg-indigo-600 py-3 font-semibold hover:bg-indigo-500"
          onClick={() => {
            if (ruleSource === "builtin") {
              const timerTo = appPath.timer(
                ruleId.trim().length > 0 ? { rule: ruleId } : undefined,
              );
              navigate(timerTo);
              return;
            }

            try {
              const config = buildCustomConfig(customForm);
              setCustomError(null);
              navigate(appPath.timer(), { state: { customConfig: config } });
            } catch (e) {
              setCustomError(e instanceof Error ? e.message : "入力が不正です");
            }
          }}
        >
          この設定で開始
        </button>
      </main>
    </div>
  );
}

type CustomRuleFormState = {
  name: string;
  player1MainSeconds: string;
  player1ByoyomiSeconds: string;
  player1FischerSeconds: string;
  player2MainSeconds: string;
  player2ByoyomiSeconds: string;
  player2FischerSeconds: string;
  announceMinutes: number[];
  announceSeconds: number[];
  countdownFrom: number;
};

function defaultCustomForm(): CustomRuleFormState {
  return {
    name: "カスタム",
    player1MainSeconds: "600",
    player1ByoyomiSeconds: "30",
    player1FischerSeconds: "",
    player2MainSeconds: "600",
    player2ByoyomiSeconds: "30",
    player2FischerSeconds: "",
    announceMinutes: [10, 5, 1],
    announceSeconds: [50, 40, 30, 20, 10],
    countdownFrom: 10,
  };
}

function fromConfigToForm(c: ClockConfigV1): CustomRuleFormState {
  return {
    name: c.name,
    player1MainSeconds: String(c.time.player1.mainSeconds),
    player1ByoyomiSeconds:
      c.time.player1.byoyomiSeconds !== undefined
        ? String(c.time.player1.byoyomiSeconds)
        : "",
    player1FischerSeconds:
      c.time.player1.fischerSeconds !== undefined
        ? String(c.time.player1.fischerSeconds)
        : "",
    player2MainSeconds: String(c.time.player2.mainSeconds),
    player2ByoyomiSeconds:
      c.time.player2.byoyomiSeconds !== undefined
        ? String(c.time.player2.byoyomiSeconds)
        : "",
    player2FischerSeconds:
      c.time.player2.fischerSeconds !== undefined
        ? String(c.time.player2.fischerSeconds)
        : "",
    announceMinutes: c.audio.announceMinutes ?? [],
    announceSeconds: c.audio.announceSeconds ?? [],
    countdownFrom: c.audio.countdownFrom ?? 0,
  };
}

function parseOptionalInt(s: string): number | undefined {
  const t = s.trim();
  if (t.length === 0) return undefined;
  const n = Number(t);
  return Number.isInteger(n) ? n : NaN;
}

function parseRequiredInt(s: string): number {
  const n = Number(s.trim());
  return Number.isInteger(n) ? n : NaN;
}

function buildCustomConfig(form: CustomRuleFormState): ClockConfigV1 {
  const raw: unknown = {
    version: 1,
    name: form.name,
    time: {
      player1: {
        mainSeconds: parseRequiredInt(form.player1MainSeconds),
        byoyomiSeconds: parseOptionalInt(form.player1ByoyomiSeconds),
        fischerSeconds: parseOptionalInt(form.player1FischerSeconds),
      },
      player2: {
        mainSeconds: parseRequiredInt(form.player2MainSeconds),
        byoyomiSeconds: parseOptionalInt(form.player2ByoyomiSeconds),
        fischerSeconds: parseOptionalInt(form.player2FischerSeconds),
      },
    },
    audio: {
      announceMinutes: form.announceMinutes,
      announceSeconds: form.announceSeconds,
      countdownFrom: form.countdownFrom,
    },
  };
  return validateConfigV1(raw);
}

function toggleNumber(list: number[], n: number): number[] {
  const set = new Set(list);
  if (set.has(n)) set.delete(n);
  else set.add(n);
  return Array.from(set).sort((a, b) => b - a);
}

function CustomRuleEditor(props: {
  value: CustomRuleFormState;
  onChange: (v: CustomRuleFormState) => void;
  errorMessage: string | null;
  onClearError: () => void;
}) {
  const v = props.value;
  const set = (patch: Partial<CustomRuleFormState>) => {
    props.onClearError();
    props.onChange({ ...v, ...patch });
  };

  return (
    <div className="space-y-4">
      {props.errorMessage && (
        <p className="rounded-md border border-red-500/60 bg-red-500/10 p-3 text-sm">
          {props.errorMessage}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-xs opacity-80" htmlFor="custom-name">
          ルール名
        </label>
        <input
          id="custom-name"
          className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm"
          value={v.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TimeEditor
          title="プレイヤー1"
          mainSeconds={v.player1MainSeconds}
          byoyomiSeconds={v.player1ByoyomiSeconds}
          fischerSeconds={v.player1FischerSeconds}
          onChange={(p) =>
            set({
              player1MainSeconds: p.mainSeconds,
              player1ByoyomiSeconds: p.byoyomiSeconds,
              player1FischerSeconds: p.fischerSeconds,
            })
          }
        />
        <TimeEditor
          title="プレイヤー2"
          mainSeconds={v.player2MainSeconds}
          byoyomiSeconds={v.player2ByoyomiSeconds}
          fischerSeconds={v.player2FischerSeconds}
          onChange={(p) =>
            set({
              player2MainSeconds: p.mainSeconds,
              player2ByoyomiSeconds: p.byoyomiSeconds,
              player2FischerSeconds: p.fischerSeconds,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">音声</div>

        <div className="space-y-2">
          <div className="text-xs opacity-80">残り○分の読み上げ（持ち時間中）</div>
          <div className="flex flex-wrap gap-2">
            {ANNOUNCE_ALLOWED_MINUTES_LIST.map((n) => (
              <label
                key={n}
                className="flex items-center gap-2 rounded-md bg-gray-800 px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={v.announceMinutes.includes(n)}
                  onChange={() =>
                    set({ announceMinutes: toggleNumber(v.announceMinutes, n) })
                  }
                />
                {n}分
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs opacity-80">残り○秒の読み上げ（持ち時間中）</div>
          <div className="flex flex-wrap gap-2">
            {ANNOUNCE_ALLOWED_SECONDS_LIST.map((n) => (
              <label
                key={n}
                className="flex items-center gap-2 rounded-md bg-gray-800 px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={v.announceSeconds.includes(n)}
                  onChange={() =>
                    set({ announceSeconds: toggleNumber(v.announceSeconds, n) })
                  }
                />
                {n}秒
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs opacity-80" htmlFor="countdown-from">
            秒読みのカウントダウン開始（秒読み中のみ）
          </label>
          <select
            id="countdown-from"
            className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm"
            value={String(v.countdownFrom)}
            onChange={(e) => set({ countdownFrom: Number(e.target.value) })}
          >
            {Array.from({ length: ANNOUNCE_ALLOWED_COUNTDOWN_MAX + 1 }).map(
              (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? "しない" : `${i}秒から`}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

function TimeEditor(props: {
  title: string;
  mainSeconds: string;
  byoyomiSeconds: string;
  fischerSeconds: string;
  onChange: (p: {
    mainSeconds: string;
    byoyomiSeconds: string;
    fischerSeconds: string;
  }) => void;
}) {
  const set = (
    patch: Partial<{
      mainSeconds: string;
      byoyomiSeconds: string;
      fischerSeconds: string;
    }>,
  ) =>
    props.onChange({
      mainSeconds: patch.mainSeconds ?? props.mainSeconds,
      byoyomiSeconds: patch.byoyomiSeconds ?? props.byoyomiSeconds,
      fischerSeconds: patch.fischerSeconds ?? props.fischerSeconds,
    });

  return (
    <div className="rounded-lg border border-gray-700 p-3 space-y-2">
      <div className="text-sm font-semibold">{props.title}</div>
      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs opacity-80" htmlFor={`${props.title}-main`}>
          持ち時間（秒）
        </label>
        <input
          id={`${props.title}-main`}
          type="number"
          min={0}
          step={1}
          className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm"
          value={props.mainSeconds}
          onChange={(e) => set({ mainSeconds: e.target.value })}
        />

        <label className="text-xs opacity-80" htmlFor={`${props.title}-byoyomi`}>
          秒読み（秒, 任意）
        </label>
        <input
          id={`${props.title}-byoyomi`}
          type="number"
          min={0}
          step={1}
          className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm"
          value={props.byoyomiSeconds}
          onChange={(e) => set({ byoyomiSeconds: e.target.value })}
          placeholder="未設定なら空"
        />

        <label className="text-xs opacity-80" htmlFor={`${props.title}-fischer`}>
          フィッシャー増分（秒, 任意）
        </label>
        <input
          id={`${props.title}-fischer`}
          type="number"
          min={0}
          step={1}
          className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm"
          value={props.fischerSeconds}
          onChange={(e) => set({ fischerSeconds: e.target.value })}
          placeholder="未設定なら空"
        />
      </div>
    </div>
  );
}
