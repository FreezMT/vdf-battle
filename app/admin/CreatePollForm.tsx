"use client";

import { useState } from "react";
import { createPoll } from "@/app/actions";
import { Plus, Trash2, Timer } from "lucide-react";

const DURATION_OPTIONS = [
  { value: 15, label: "15 сек" },
  { value: 30, label: "30 сек" },
  { value: 60, label: "1 мин" },
  { value: 120, label: "2 мин" },
] as const;

export default function CreatePollForm() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (i: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== i));
    }
  };

  const updateOption = (i: number, v: string) => {
    const next = [...options];
    next[i] = v;
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.set("question", question);
    formData.set(
      "options",
      options.filter((o) => o.trim()).join("\n")
    );
    formData.set("durationSeconds", String(durationSeconds));
    formData.set("status", status);
    const result = await createPoll(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setQuestion("");
    setOptions(["", ""]);
    setDurationSeconds(60);
    setStatus("open");
  };

  if (success) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <p className="text-text font-medium mb-4">Опрос успешно опубликован!</p>
        <button
          onClick={() => setSuccess(false)}
          className="px-4 py-2 rounded-lg bg-border text-bg text-sm hover:bg-text/80 transition-colors"
        >
          Создать ещё
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-text mb-4">Создать опрос</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text/80 mb-1">
            Вопрос
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Например: Кто выиграл батл?"
            className="w-full px-4 py-3 rounded-lg border border-border bg-bg text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-border"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            Видимость
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                checked={status === "open"}
                onChange={() => setStatus("open")}
                className="accent-border"
              />
              <span className="text-sm">Открытый — сразу на ленте</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                checked={status === "closed"}
                onChange={() => setStatus("closed")}
                className="accent-border"
              />
              <span className="text-sm">Закрытый — в архив</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            <span className="flex items-center gap-1.5">
              <Timer size={14} />
              Таймер
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDurationSeconds(opt.value)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  durationSeconds === opt.value
                    ? "bg-border text-bg font-medium"
                    : "bg-bg text-text/70 hover:text-text border border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            Варианты ответов (2–10)
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Вариант ${i + 1}`}
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-bg text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-border"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 2}
                  className="p-2 rounded-lg border border-border text-text/60 hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Удалить"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-2 text-sm text-text/60 hover:text-text"
            >
              <Plus size={16} />
              Добавить вариант
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-border text-bg font-medium hover:bg-text/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Публикация…" : "Опубликовать"}
        </button>
      </form>
    </div>
  );
}
