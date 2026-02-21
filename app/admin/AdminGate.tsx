"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { verifyAdminPin } from "@/app/actions";
import CreatePollForm from "./CreatePollForm";
import AdminPollList from "./AdminPollList";
import AdminArchive from "./AdminArchive";

type Option = {
  id: string;
  text: string;
  voteCount: number;
};

type Poll = {
  id: string;
  question: string;
  status: string;
  options: Option[];
  createdAt: Date;
  durationSeconds: number;
};

type AdminGateProps = {
  polls: Poll[];
};

export default function AdminGate({ polls }: AdminGateProps) {
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = await verifyAdminPin(pin);
    if (ok) {
      setVerified(true);
    } else {
      setError("Неверный PIN-код");
    }
  };

  if (verified) {
    return (
      <div className="space-y-6">
        <CreatePollForm />
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-6">
          <AdminPollList polls={polls.filter((p) => p.status === "open")} pin={pin} />
          <div className="border-t border-border pt-6">
            <AdminArchive polls={polls.filter((p) => p.status === "closed")} pin={pin} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={20} className="text-text/70" />
        <h1 className="text-lg font-semibold text-text">Панель администратора</h1>
      </div>
      <p className="text-sm text-text/60 mb-4">
        Введите PIN-код для создания опросов
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="w-full px-4 py-3 rounded-lg border border-border bg-bg text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-border"
          autoFocus
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-border text-bg font-medium hover:bg-text/90 transition-colors"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
