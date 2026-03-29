"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getModelStatus,
    getPreviewData,
    getResults,
    processData,
    saveUserDetails,
    trainModel,
    uploadDataset,
    type AuthUser,
    type ModelOutput,
} from "@/lib/api";

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: { id: Step; title: string }[] = [
    { id: 1, title: "Profile" },
    { id: 2, title: "Upload" },
    { id: 3, title: "Preview" },
    { id: 4, title: "Process" },
    { id: 5, title: "Training" },
];

const LOCAL_USER_KEY = "pharmasens_user";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [globalError, setGlobalError] = useState("");

    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [city, setCity] = useState("");
    const [stateName, setStateName] = useState("");
    const [pharmacyType, setPharmacyType] = useState("");
    const [savingDetails, setSavingDetails] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const [columns, setColumns] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<Record<string, string | number | null>[]>([]);
    const [dateColumn, setDateColumn] = useState("");
    const [salesColumn, setSalesColumn] = useState("");
    const [drugColumn, setDrugColumn] = useState("");
    const [locationColumn, setLocationColumn] = useState("");

    const [processing, setProcessing] = useState(false);
    const [processedRows, setProcessedRows] = useState<number | null>(null);

    const [trainingStarted, setTrainingStarted] = useState(false);
    const [trainingQuickResult, setTrainingQuickResult] = useState<ModelOutput | null>(null);
    const [modelStatus, setModelStatus] = useState<{ linear: string; rf: string; tft: string }>({
        linear: "not_started",
        rf: "not_started",
        tft: "not_started",
    });
    const [selectedModel, setSelectedModel] = useState<"linear" | "rf" | "tft">("linear");
    const [activeResult, setActiveResult] = useState<ModelOutput | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (!raw) {
            router.replace("/login");
            return;
        }

        try {
            const parsed = JSON.parse(raw) as AuthUser;
            setUser(parsed);
            setFullName(parsed.name || "");

            if (parsed.hasUploadedData && !parsed.isNewUser) {
                router.replace("/dashboard");
            }
        } catch {
            localStorage.removeItem(LOCAL_USER_KEY);
            router.replace("/login");
        }
    }, [router]);

    useEffect(() => {
        if (!user || step < 3) {
            return;
        }

        if (previewRows.length > 0 && columns.length > 0) {
            return;
        }

        getPreviewData(user.email)
            .then((res) => {
                setColumns(res.columns);
                setPreviewRows(res.preview);
            })
            .catch(() => {
                // Keep silent here; upload step has primary error surface.
            });
    }, [user, step, previewRows.length, columns.length]);

    useEffect(() => {
        if (!user || step !== 5 || !trainingStarted) {
            return;
        }

        const tick = () => {
            getModelStatus(user.email)
                .then((res) => {
                    setModelStatus(res.status);
                })
                .catch(() => {
                    // Allow polling to continue silently.
                });

            getResults(user.email, selectedModel)
                .then((res) => {
                    setActiveResult(res.active);
                    if (res.results.linear) {
                        setTrainingQuickResult(res.results.linear);
                    }
                })
                .catch(() => {
                    // Results may not exist yet while training starts.
                });
        };

        tick();
        const id = window.setInterval(tick, 3000);
        return () => window.clearInterval(id);
    }, [user, step, trainingStarted, selectedModel]);

    const previewHeaders = useMemo(() => {
        if (previewRows.length === 0) {
            return [] as string[];
        }
        return Object.keys(previewRows[0]);
    }, [previewRows]);

    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setGlobalError("");
        setSavingDetails(true);
        try {
            await saveUserDetails({
                email: user.email,
                fullName,
                companyName,
                city,
                state: stateName,
                pharmacyType,
            });
            setStep(2);
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : "Failed to save details");
        } finally {
            setSavingDetails(false);
        }
    };

    const handleUpload = async () => {
        if (!user || !selectedFile) return;

        setGlobalError("");
        setUploading(true);
        try {
            const res = await uploadDataset(user.email, selectedFile);
            setColumns(res.columns);
            setPreviewRows(res.preview);
            setStep(3);
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleProcess = async () => {
        if (!user) return;
        if (!dateColumn || !salesColumn || !drugColumn) {
            setGlobalError("Please select date, sales, and drug columns.");
            return;
        }

        if (new Set([dateColumn, salesColumn, drugColumn]).size !== 3) {
            setGlobalError("Date, sales, and drug columns must be different.");
            return;
        }

        if (locationColumn && [dateColumn, salesColumn, drugColumn].includes(locationColumn)) {
            setGlobalError("Location column must be different from required columns.");
            return;
        }

        setGlobalError("");
        setStep(4);
        setProcessing(true);
        try {
            const res = await processData({
                email: user.email,
                dateColumn,
                salesColumn,
                drugColumn,
                locationColumn: locationColumn || undefined,
            });
            setProcessedRows(res.processedRows);
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : "Processing failed");
            setStep(3);
        } finally {
            setProcessing(false);
        }
    };

    const handleStartTraining = async () => {
        if (!user) return;

        setGlobalError("");
        setStep(5);
        try {
            const res = await trainModel(user.email);
            setTrainingStarted(true);
            setTrainingQuickResult(res.linear);
            setActiveResult(res.linear);
            setModelStatus({ linear: "ready", rf: "training", tft: "training" });

            const updatedUser: AuthUser = {
                ...user,
                isNewUser: false,
                hasUploadedData: true,
            };
            setUser(updatedUser);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : "Model training failed");
        }
    };

    const onDropFile = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const statusText = (status: string) => {
        if (status === "ready") return "Ready";
        if (status === "training") return "Training";
        if (status === "failed") return "Failed";
        return "Pending";
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0D1117] text-[#C9D1D9]">
            <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(218,54,51,0.14) 0px, rgba(218,54,51,0.14) 1px, transparent 1px, transparent 40px)",
                }}
            />

            <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 lg:px-8">
                <section className="w-full max-w-6xl border border-[rgba(255,255,255,0.12)] bg-[#0D1117]">
                    <header className="border-b border-[rgba(255,255,255,0.12)] px-6 py-6 lg:px-8">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#F85149]">New User Onboarding</p>
                        <h1 className="mt-3 text-3xl font-light text-white">Dataset Pipeline Setup</h1>
                        <p className="mt-2 text-sm text-[#8B949E]">
                            Complete your profile, upload a dataset, and start AI forecasting.
                        </p>
                    </header>

                    <div className="grid border-b border-[rgba(255,255,255,0.12)] sm:grid-cols-5">
                        {STEP_LABELS.map((item) => (
                            <div
                                key={item.id}
                                className={`border-r border-[rgba(255,255,255,0.12)] px-4 py-3 text-xs uppercase tracking-widest last:border-r-0 ${
                                    step === item.id
                                        ? "bg-[rgba(248,81,73,0.16)] text-white"
                                        : step > item.id
                                          ? "bg-[rgba(255,255,255,0.04)] text-[#C9D1D9]"
                                          : "text-[#8B949E]"
                                }`}
                            >
                                Step {item.id}: {item.title}
                            </div>
                        ))}
                    </div>

                    {globalError ? (
                        <div className="border-b border-[rgba(255,255,255,0.12)] bg-[rgba(248,81,73,0.14)] px-6 py-3 text-sm text-[#FCA5A5]">
                            {globalError}
                        </div>
                    ) : null}

                    <div className="p-6 lg:p-8">
                        {step === 1 && (
                            <form onSubmit={handleSaveDetails} className="grid gap-5 lg:grid-cols-2">
                                <div className="lg:col-span-2">
                                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Full Name</label>
                                    <input
                                        className="input-field"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Pharmacy / Company Name</label>
                                    <input
                                        className="input-field"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">City</label>
                                    <input className="input-field" value={city} onChange={(e) => setCity(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">State</label>
                                    <input
                                        className="input-field"
                                        value={stateName}
                                        onChange={(e) => setStateName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Type of Pharmacy (Optional)</label>
                                    <input
                                        className="input-field"
                                        value={pharmacyType}
                                        onChange={(e) => setPharmacyType(e.target.value)}
                                        placeholder="Retail, Hospital, Chain, Distributor"
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <button
                                        type="submit"
                                        disabled={savingDetails}
                                        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingDetails ? "Saving profile..." : "Continue To Dataset Upload"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="space-y-5">
                                <div
                                    className="flex min-h-[220px] flex-col items-center justify-center border border-[rgba(255,255,255,0.12)] bg-[#161B22] p-8 text-center"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onDropFile}
                                >
                                    <p className="text-lg font-light text-white">Drag and drop CSV/XLSX here</p>
                                    <p className="mt-2 text-sm text-[#8B949E]">or choose file manually</p>
                                    <input
                                        className="mt-6 w-full max-w-sm border border-[rgba(255,255,255,0.12)] bg-black px-3 py-2 text-sm"
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                </div>

                                {selectedFile ? (
                                    <div className="border border-[rgba(255,255,255,0.12)] px-4 py-3 text-sm text-[#C9D1D9]">
                                        <p>File: {selectedFile.name}</p>
                                        <p className="text-[#8B949E]">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploading}
                                    className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {uploading ? "Uploading dataset..." : "Upload And Preview"}
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Date Column</label>
                                        <select className="input-field" value={dateColumn} onChange={(e) => setDateColumn(e.target.value)}>
                                            <option value="">Select column</option>
                                            {columns.map((col) => (
                                                <option key={col} value={col}>
                                                    {col}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Sales / Quantity Column</label>
                                        <select className="input-field" value={salesColumn} onChange={(e) => setSalesColumn(e.target.value)}>
                                            <option value="">Select column</option>
                                            {columns.map((col) => (
                                                <option key={col} value={col}>
                                                    {col}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Drug / Product Column</label>
                                        <select className="input-field" value={drugColumn} onChange={(e) => setDrugColumn(e.target.value)}>
                                            <option value="">Select column</option>
                                            {columns.map((col) => (
                                                <option key={col} value={col}>
                                                    {col}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Location Column (Optional)</label>
                                        <select className="input-field" value={locationColumn} onChange={(e) => setLocationColumn(e.target.value)}>
                                            <option value="">Not selected</option>
                                            {columns.map((col) => (
                                                <option key={col} value={col}>
                                                    {col}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-[rgba(255,255,255,0.12)]">
                                    <table className="w-full border-collapse text-left text-sm">
                                        <thead className="bg-[rgba(255,255,255,0.04)]">
                                            <tr>
                                                {previewHeaders.map((header) => (
                                                    <th
                                                        key={header}
                                                        className="border-b border-r border-[rgba(255,255,255,0.12)] px-3 py-2 font-medium text-[#C9D1D9] last:border-r-0"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((row, idx) => (
                                                <tr key={idx} className="odd:bg-[#0D1117] even:bg-[#11161D]">
                                                    {previewHeaders.map((header) => (
                                                        <td
                                                            key={`${idx}-${header}`}
                                                            className="border-r border-[rgba(255,255,255,0.12)] px-3 py-2 text-[#8B949E] last:border-r-0"
                                                        >
                                                            {String(row[header] ?? "")}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <button type="button" onClick={handleProcess} className="btn-primary w-full justify-center">
                                    Confirm And Process Data
                                </button>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-5 border border-[rgba(255,255,255,0.12)] bg-[#161B22] p-6">
                                <p className="text-xl font-light text-white">Data Processing & Feature Engineering</p>
                                {processing ? (
                                    <>
                                        <p className="text-sm text-[#8B949E]">Processing your data...</p>
                                        <div className="h-2 w-full bg-[rgba(255,255,255,0.1)]">
                                            <div className="h-full w-1/2 animate-pulse bg-[#F85149]" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-[#34D399]">Data successfully prepared.</p>
                                        <p className="text-sm text-[#8B949E]">
                                            {processedRows ?? 0} rows cleaned, sorted, and transformed with lag_1 to lag_7 features.
                                        </p>
                                        <button type="button" onClick={handleStartTraining} className="btn-primary w-full justify-center">
                                            Start Model Training
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-3">
                                    {([
                                        ["linear", "Linear"],
                                        ["rf", "Random Forest"],
                                        ["tft", "TFT"],
                                    ] as const).map(([key, label]) => (
                                        <div key={key} className="border border-[rgba(255,255,255,0.12)] bg-[#161B22] px-4 py-3">
                                            <p className="text-xs uppercase tracking-widest text-[#8B949E]">{label}</p>
                                            <p className="mt-2 text-sm text-white">{statusText(modelStatus[key])}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border border-[rgba(255,255,255,0.12)] bg-[#161B22] px-5 py-4">
                                    <p className="text-sm text-white">Quick results ready</p>
                                    <p className="mt-1 text-sm text-[#8B949E]">Advanced models are training in background.</p>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    {([
                                        ["linear", "Linear"],
                                        ["rf", "Random Forest"],
                                        ["tft", "TFT"],
                                    ] as const).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setSelectedModel(key)}
                                            disabled={modelStatus[key] !== "ready" && key !== "linear"}
                                            className={`border px-4 py-3 text-sm ${
                                                selectedModel === key
                                                    ? "border-[rgba(248,81,73,0.7)] bg-[rgba(248,81,73,0.18)] text-white"
                                                    : "border-[rgba(255,255,255,0.12)] bg-[#0D1117] text-[#C9D1D9]"
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {(activeResult || trainingQuickResult) && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="border border-[rgba(255,255,255,0.12)] bg-[#0D1117] p-4">
                                            <p className="text-xs uppercase tracking-widest text-[#8B949E]">Model Accuracy</p>
                                            <p className="mt-2 text-2xl font-semibold text-white">{(activeResult || trainingQuickResult)?.accuracy}%</p>
                                        </div>
                                        <div className="border border-[rgba(255,255,255,0.12)] bg-[#0D1117] p-4">
                                            <p className="text-xs uppercase tracking-widest text-[#8B949E]">Mean Absolute Error</p>
                                            <p className="mt-2 text-2xl font-semibold text-white">{(activeResult || trainingQuickResult)?.mae}</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => router.push("/dashboard")}
                                    className="btn-primary w-full justify-center"
                                >
                                    Open Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
