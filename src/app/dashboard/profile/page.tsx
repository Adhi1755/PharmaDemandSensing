"use client";

import { useEffect, useState } from "react";

import { type AuthUser } from "@/lib/api";

const LOCAL_USER_KEY = "pharmasens_user";

export default function ProfilePage() {
    const [user] = useState<AuthUser | null>(() => {
        if (typeof window === "undefined") return null;
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as AuthUser;
        } catch {
            return null;
        }
    });
    const [organization, setOrganization] = useState("PharmaSense Partner Pharmacy");
    const [role, setRole] = useState("Admin");
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (!user) {
            localStorage.removeItem(LOCAL_USER_KEY);
            window.location.href = "/login";
        }
    }, [user]);

    return (
        <>
            <main data-page-main="true" className="space-y-6 p-4 pb-24 md:p-6 lg:p-8 lg:pb-8">
                <section className="glass-card rounded-2xl p-5">
                    <h2 className="text-lg font-semibold text-(--color-light-gray)">User Profile</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ProfileField
                            label="User name"
                            value={user?.name || "Not available"}
                            editable={false}
                        />
                        <ProfileField
                            label="Email"
                            value={user?.email || "Not available"}
                            editable={false}
                        />
                        <ProfileField
                            label="Organization / Pharmacy"
                            value={organization}
                            editable={editing}
                            onChange={setOrganization}
                        />
                        <ProfileField
                            label="Role"
                            value={role}
                            editable={editing}
                            onChange={setRole}
                        />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="button"
                            className="btn-secondary rounded-xl"
                            onClick={() => setEditing((prev) => !prev)}
                        >
                            {editing ? "Finish editing" : "Edit profile"}
                        </button>
                        <button
                            type="button"
                            className="btn-primary rounded-xl"
                            onClick={() => {
                                localStorage.removeItem(LOCAL_USER_KEY);
                                window.location.href = "/";
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </section>
            </main>
        </>
    );
}

function ProfileField({
    label,
    value,
    editable,
    onChange,
}: {
    label: string;
    value: string;
    editable: boolean;
    onChange?: (value: string) => void;
}) {
    return (
        <label className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-xs uppercase tracking-widest text-[rgba(191,191,191,1)]">{label}</p>
            {editable && onChange ? (
                <input
                    className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.2)] bg-black px-3 py-2 text-sm text-(--color-light-gray)"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
            ) : (
                <p className="mt-2 text-sm text-(--color-light-gray)">{value}</p>
            )}
        </label>
    );
}
