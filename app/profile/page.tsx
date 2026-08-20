"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AgentOnly from "@/components/AgentOnly";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, api } from "@/lib/api";

function Profile() {
  const { user, refresh } = useAuth();

  const [contacts, setContacts] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    telegram: "",
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [contactsSaved, setContactsSaved] = useState(false);

  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (!user?.agent) return;
    setContacts({
      full_name: user.agent.full_name ?? "",
      phone: user.agent.phone ?? "",
      whatsapp: user.agent.whatsapp ?? "",
      telegram: user.agent.telegram ?? "",
    });
  }, [user]);

  const saveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactErrors({});
    setContactsSaved(false);
    try {
      await api.updateProfile(contacts);
      await refresh();
      setContactsSaved(true);
    } catch (err) {
      setContactErrors(
        err instanceof ApiError ? err.fieldErrors() : { detail: "Не удалось сохранить" }
      );
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSaved(false);
    try {
      await api.changePassword(passwords.current_password, passwords.new_password);
      setPasswords({ current_password: "", new_password: "" });
      setPasswordSaved(true);
    } catch (err) {
      setPasswordErrors(
        err instanceof ApiError ? err.fieldErrors() : { detail: "Не удалось сменить пароль" }
      );
    }
  };

  const field = (
    value: string,
    onChange: (v: string) => void,
    label: string,
    error?: string,
    type = "text",
    hint?: string
  ) => (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <input
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === "password" ? "new-password" : "off"}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-primary">{error}</p>}
    </div>
  );

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-2xl font-semibold">Профиль</h1>
        <p className="mb-6 text-sm text-muted">
          Логин: {user?.username}
          {user?.is_manager ? " · Руководитель" : ""}
        </p>

        {!user?.agent && (
          <div className="card mb-6">
            <h2 className="mb-2 text-sm font-semibold">Профиля агента нет</h2>
            <p className="text-sm text-muted">
              Вы вошли под учётной записью без карточки агента — обычно это
              администратор сайта. Чтобы вести объекты и попадать в фильтр
              «Куратор», заведите себе агента в{" "}
              <Link href="/settings/agents" className="underline underline-offset-2">
                настройках
              </Link>{" "}
              и укажите этот же логин.
            </p>
          </div>
        )}

        <form onSubmit={saveContacts} className="card mb-6">
          <h2 className="mb-3 text-sm font-semibold">Мои контакты</h2>
          <p className="mb-3 text-xs text-muted">
            Эти данные видит клиент на карточке объекта, где вы куратор.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {field(
              contacts.full_name,
              (v) => setContacts((p) => ({ ...p, full_name: v })),
              "ФИО",
              contactErrors.full_name
            )}
            {field(
              contacts.phone,
              (v) => setContacts((p) => ({ ...p, phone: v })),
              "Телефон",
              contactErrors.phone
            )}
            {field(
              contacts.whatsapp,
              (v) => setContacts((p) => ({ ...p, whatsapp: v })),
              "WhatsApp",
              contactErrors.whatsapp,
              "text",
              "Только цифры, иначе возьмём телефон"
            )}
            {field(
              contacts.telegram,
              (v) => setContacts((p) => ({ ...p, telegram: v })),
              "Telegram",
              contactErrors.telegram,
              "text",
              "Ник без @"
            )}
          </div>
          {contactErrors.detail && (
            <p className="mt-3 text-sm text-primary">{contactErrors.detail}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button className="btn btn-primary" disabled={!user?.agent}>
              Сохранить
            </button>
            {contactsSaved && <span className="text-sm text-muted">Сохранено</span>}
          </div>
        </form>

        <form onSubmit={savePassword} className="card">
          <h2 className="mb-3 text-sm font-semibold">Смена пароля</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {field(
              passwords.current_password,
              (v) => setPasswords((p) => ({ ...p, current_password: v })),
              "Текущий пароль",
              passwordErrors.current_password,
              "password"
            )}
            {field(
              passwords.new_password,
              (v) => setPasswords((p) => ({ ...p, new_password: v })),
              "Новый пароль",
              passwordErrors.new_password,
              "password",
              "Минимум 8 символов, не только цифры"
            )}
          </div>
          {passwordErrors.detail && (
            <p className="mt-3 text-sm text-primary">{passwordErrors.detail}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button className="btn btn-primary">Сменить пароль</button>
            {passwordSaved && <span className="text-sm text-muted">Пароль изменён</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AgentOnly>
      <Profile />
    </AgentOnly>
  );
}
