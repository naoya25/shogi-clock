import { useNavigate, useSearchParams } from "react-router-dom";
import { appPath } from "../routes";
import { getAllConfigs } from "../features/rules/load";
import { useMemo, useState } from "react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const allConfigs = useMemo(() => getAllConfigs(), []);
  const initialRuleId = useMemo(() => {
    const fromQuery = searchParams.get("rule");
    if (fromQuery && allConfigs.some((c) => c.id === fromQuery))
      return fromQuery;
    return allConfigs[0]?.id ?? "";
  }, [allConfigs, searchParams]);

  const [ruleId, setRuleId] = useState<string>(initialRuleId);
  const timerTo = appPath.timer(
    ruleId.trim().length > 0 ? { rule: ruleId } : undefined,
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <main className="mt-4 space-y-4">
        <section className="rounded-xl border border-gray-700 p-4">
          <h2 className="font-semibold">ルール選択</h2>
          <div className="mt-3 space-y-2">
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
        </section>

        <button
          className="w-full rounded-md bg-indigo-600 py-3 font-semibold hover:bg-indigo-500"
          onClick={() => navigate(timerTo)}
        >
          この設定で開始
        </button>
      </main>
    </div>
  );
}
