"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Car,
  Bike,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Trash2,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Lock,
  LogOut,
  User,
  Plus,
  X,
  MapPin,
  Check,
  Shield,
  FileText,
  AlertTriangle,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import { Application, ApplicationStatus, PlatformType, VehicleType, TicketType } from "@/lib/types";

export default function UnifiedManagerPage() {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    displayName: string;
    role: "admin" | "recruiter";
  } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Admin filter tabs
  const [adminActiveTab, setAdminActiveTab] = useState<"husein" | "ionutvarga" | "all">("husein");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Applications / Tickets state
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string>("all");

  // Add Ticket Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTicketType, setFormTicketType] = useState<TicketType>("activare_cont");
  const [formTargetRecruiter, setFormTargetRecruiter] = useState<"glovowolt" | "ionutvarga">("glovowolt");
  const [formFullName, setFormFullName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNewPhone, setFormNewPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCity, setFormCity] = useState("București");
  const [formPlatforms, setFormPlatforms] = useState<PlatformType[]>(["glovo"]);
  const [formVehicleType, setFormVehicleType] = useState<VehicleType>("masina");
  const [formOldVehicleType, setFormOldVehicleType] = useState<VehicleType>("bicicleta");
  const [formIdCardPhoto, setFormIdCardPhoto] = useState("");
  const [formSelfiePhoto, setFormSelfiePhoto] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState("");

  // Rejection Reason Modal
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    appId: string;
    courierName: string;
    reason: string;
  } | null>(null);

  // Update Photos Modal State (schimbare vehicul acte / poze suplimentare)
  const [photoUpdateModal, setPhotoUpdateModal] = useState<{
    open: boolean;
    appId: string;
    courierName: string;
    ticketType: TicketType;
    idCardPhoto: string;
    selfiePhoto: string;
  } | null>(null);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [photoUpdateError, setPhotoUpdateError] = useState("");

  // High-res preview modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsCheckingAuth(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.authenticated && data.user) {
        setCurrentUser(data.user);
        fetchApplications();
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("Introdu utilizatorul și parola.");
      return;
    }

    try {
      setIsLoggingIn(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Date de autentificare incorecte.");
      }

      setCurrentUser(data.user);
      setLoginUsername("");
      setLoginPassword("");
      fetchApplications();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError("Eroare la autentificare.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setApplications([]);
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setCurrentUser(null);
          return;
        }
        throw new Error(data.message || "Eroare la preluarea tichetelor.");
      }
      setApplications(data.applications || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Eroare de conexiune la server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (p: PlatformType) => {
    if (formPlatforms.includes(p)) {
      if (formPlatforms.length === 1) return;
      setFormPlatforms(formPlatforms.filter((item) => item !== p));
    } else {
      setFormPlatforms([...formPlatforms, p]);
    }
  };

  const openNewTicketModal = (type: TicketType) => {
    setFormTicketType(type);
    setFormFullName("");
    setFormPhone("");
    setFormNewPhone("");
    setFormEmail("");
    setFormIdCardPhoto("");
    setFormSelfiePhoto("");
    setFormNotes("");
    setSubmitError("");
    setSubmitSuccessMsg("");
    setIsAddModalOpen(true);
  };

  const handleSaveUpdatedPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUpdateModal) return;

    if (!photoUpdateModal.idCardPhoto && !photoUpdateModal.selfiePhoto) {
      setPhotoUpdateError("Alege cel puțin un document sau o poză de încărcat.");
      return;
    }

    try {
      setIsSavingPhotos(true);
      setPhotoUpdateError("");
      const res = await fetch(`/api/applications/${photoUpdateModal.appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCardPhoto: photoUpdateModal.idCardPhoto || undefined,
          selfiePhoto: photoUpdateModal.selfiePhoto || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Eroare la actualizarea pozelor.");
      }

      if (data.application) {
        setApplications((prev) =>
          prev.map((item) => (item.id === data.application.id ? data.application : item))
        );
      }
      setPhotoUpdateModal(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPhotoUpdateError(err.message);
      } else {
        setPhotoUpdateError("Eroare la salvarea pozelor.");
      }
    } finally {
      setIsSavingPhotos(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccessMsg("");

    if (!formFullName.trim()) {
      setSubmitError("Numele și prenumele sunt obligatorii.");
      return;
    }

    if (formPlatforms.length === 0) {
      setSubmitError("Selectează cel puțin o platformă (Glovo sau Wolt).");
      return;
    }

    if (formTicketType === "activare_cont") {
      if (!formPhone.trim()) {
        setSubmitError("Numărul de telefon este obligatoriu.");
        return;
      }
      if (!formEmail.trim() || !formEmail.includes("@")) {
        setSubmitError("Adresa de email este obligatorie.");
        return;
      }
      if (!formIdCardPhoto) {
        setSubmitError("Încarcă poza sau fișierul PDF al buletinului.");
        return;
      }
      if (!formSelfiePhoto) {
        setSubmitError("Încarcă selfie-ul cu buletinul în mână.");
        return;
      }
    } else if (formTicketType === "schimbare_vehicul") {
      if (!formPhone.trim()) {
        setSubmitError("Numărul de telefon al curierului este obligatoriu.");
        return;
      }
      if (formOldVehicleType === formVehicleType) {
        setSubmitError("Vehiculul nou trebuie să fie diferit de vehiculul actual.");
        return;
      }
      if (formPlatforms.includes("glovo") && !formIdCardPhoto) {
        setSubmitError("Pentru Glovo este obligatoriu să încarci actele vehiculului (talon / asigurare sau buletin).");
        return;
      }
    } else if (formTicketType === "schimbare_telefon") {
      if (!formPhone.trim()) {
        setSubmitError("Numărul actual de telefon este obligatoriu.");
        return;
      }
      if (!formNewPhone.trim()) {
        setSubmitError("Noul număr de telefon este obligatoriu.");
        return;
      }
      if (formPhone.trim() === formNewPhone.trim()) {
        setSubmitError("Numărul nou trebuie să fie diferit de numărul vechi.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiter: currentUser?.role === "admin" ? formTargetRecruiter : undefined,
          ticketType: formTicketType,
          fullName: formFullName,
          phone: formPhone,
          newPhone: formNewPhone,
          email: formEmail,
          city: formCity,
          platforms: formPlatforms,
          vehicleType: formVehicleType,
          oldVehicleType: formOldVehicleType,
          idCardPhoto: formIdCardPhoto,
          selfiePhoto: formSelfiePhoto,
          notes: formNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Eroare la crearea tichetului.");
      }

      if (data.application) {
        setApplications((prev) => [data.application, ...prev]);
      } else {
        fetchApplications();
      }

      // Reset form
      setFormFullName("");
      setFormPhone("");
      setFormNewPhone("");
      setFormEmail("");
      setFormIdCardPhoto("");
      setFormSelfiePhoto("");
      setFormNotes("");
      setIsAddModalOpen(false);

      const successLabel =
        formTicketType === "schimbare_vehicul"
          ? "Tichetul de Schimbare Autovehicul a fost creat!"
          : formTicketType === "schimbare_telefon"
          ? "Tichetul de Schimbare Număr Telefon a fost creat!"
          : "Dosarul de Activare Cont a fost salvat!";
      setSubmitSuccessMsg(successLabel);
      setTimeout(() => setSubmitSuccessMsg(""), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Eroare neașteptată la salvare.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    // If setting to Respins, open the Rejection Reason modal!
    if (newStatus === "respins") {
      const target = applications.find((a) => a.id === id);
      setRejectModal({
        open: true,
        appId: id,
        courierName: target?.fullName || "Curier",
        reason: target?.rejectionReason || "",
      });
      return;
    }

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
      } else {
        alert("Eroare la actualizarea statusului: " + (data.message || ""));
      }
    } catch {
      alert("Eroare de rețea la actualizarea statusului.");
    }
  };

  // Confirm rejection with reason
  const handleConfirmRejection = async () => {
    if (!rejectModal) return;
    try {
      const res = await fetch(`/api/applications/${rejectModal.appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "respins",
          rejectionReason: rejectModal.reason.trim() || "Respins (fără motiv specificat)",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === rejectModal.appId
              ? {
                  ...app,
                  status: "respins",
                  rejectionReason: rejectModal.reason.trim() || "Respins (fără motiv specificat)",
                }
              : app
          )
        );
        setRejectModal(null);
      } else {
        alert("Eroare la respingere: " + (data.message || ""));
      }
    } catch {
      alert("Eroare de rețea.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Ești sigur că vrei să ștergi tichetul pentru ${name}?`)) return;

    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setApplications((prev) => prev.filter((app) => app.id !== id));
      } else {
        alert("Eroare la ștergerea cererii: " + (data.message || ""));
      }
    } catch {
      alert("Eroare de rețea la ștergere.");
    }
  };

  const handleExportCSV = () => {
    if (applications.length === 0) return;
    const headers = [
      "Data",
      "Manager",
      "Tip Tichet",
      "Nume Curier",
      "Telefon",
      "Telefon Nou",
      "Email",
      "Oras",
      "Platforme",
      "Vehicul",
      "Vehicul Vechi",
      "Status",
      "Motiv Respingere",
      "Note",
    ];
    const rows = filteredApplications.map((app) => [
      new Date(app.createdAt).toLocaleString("ro-RO"),
      `"${app.recruiter === "glovowolt" ? "Husein" : "Ionut Varga"}"`,
      `"${
        app.ticketType === "schimbare_vehicul"
          ? "Schimbare Autovehicul"
          : app.ticketType === "schimbare_telefon"
          ? "Schimbare Numar Telefon"
          : "Activare Cont Curier"
      }"`,
      `"${app.fullName.replace(/"/g, '""')}"`,
      `"${app.phone}"`,
      `"${app.newPhone || ""}"`,
      `"${app.email || ""}"`,
      `"${app.city || ""}"`,
      `"${app.platforms.join(", ")}"`,
      `"${app.vehicleType || ""}"`,
      `"${app.oldVehicleType || ""}"`,
      `"${app.status === "in_lucru" ? "In procesare" : app.status}"`,
      `"${(app.rejectionReason || "").replace(/"/g, '""')}"`,
      `"${(app.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tichete_${currentUser?.username || "curieri"}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // If admin, filter strictly by selected manager tab
      if (currentUser?.role === "admin") {
        if (adminActiveTab === "husein" && app.recruiter !== "glovowolt") return false;
        if (adminActiveTab === "ionutvarga" && app.recruiter !== "ionutvarga") return false;
      }

      const matchesSearch =
        app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.phone.includes(searchQuery) ||
        (app.newPhone && app.newPhone.includes(searchQuery)) ||
        (app.email && app.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.city && app.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const matchesPlatform = platformFilter === "all" || app.platforms.includes(platformFilter as PlatformType);
      const matchesVehicle = vehicleFilter === "all" || app.vehicleType === vehicleFilter;
      const matchesTicketType =
        ticketTypeFilter === "all" || (app.ticketType || "activare_cont") === ticketTypeFilter;

      return matchesSearch && matchesStatus && matchesPlatform && matchesVehicle && matchesTicketType;
    });
  }, [applications, searchQuery, statusFilter, platformFilter, vehicleFilter, ticketTypeFilter, currentUser, adminActiveTab]);

  // 1. Loading check
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Se încarcă aplicația...</p>
      </div>
    );
  }

  // 2. Unauthenticated: Clean Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-800">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-amber-400/10 border border-amber-400/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Autentificare Manager</h1>
            <p className="text-xs text-slate-500 mt-1">
              Introdu utilizatorul și parola pentru a accesa platforma
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Utilizator (Username)
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Introdu utilizatorul..."
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900 font-semibold placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parolă
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900 font-semibold placeholder:text-slate-400"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Se autentifică...</span>
                </>
              ) : (
                <span>Intră în Panou</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Authenticated: Unified Manager Dashboard
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-base shadow-xs">
              GW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">Portal Tichete Curieri</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                    currentUser.role === "admin"
                      ? "bg-purple-400 text-purple-950"
                      : currentUser.username === "glovowolt"
                      ? "bg-amber-400 text-amber-950"
                      : "bg-sky-400 text-sky-950"
                  }`}
                >
                  {currentUser.displayName}
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  (@{currentUser.username})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentUser.role === "admin"
                  ? "Panou Coordonator: gestionare tichete activare, schimbare vehicul & telefon"
                  : "Tichetele create sunt transmise strict coordonatorului"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5"
              title="Exportă tabelul în format CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={fetchApplications}
              disabled={isLoading}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5"
              title="Reîmprospătează datele"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition flex items-center gap-1.5 border border-rose-500/30"
              title="Deconectare"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ieșire</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Success toast if added */}
        {submitSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{submitSuccessMsg}</span>
          </div>
        )}

        {/* Action Banner: 3 Dedicated Buttons for Creating Tickets (DOAR PENTRU RECRUTORI: Husein & Ionuț Varga) */}
        {currentUser.role !== "admin" && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Gestiune Tichete Curieri (Glovo &amp; Wolt)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Creează un tichet nou pentru activare cont, schimbare autovehicul sau schimbare număr de telefon.
                </p>
              </div>
            </div>

            {/* 3 Prominent Ticket Creation Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              {/* Button 1: Activare Cont Nou */}
              <button
                type="button"
                onClick={() => openNewTicketModal("activare_cont")}
                className="p-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm transition shadow-sm hover:shadow-md flex items-center gap-3 text-left active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <div className="font-black text-amber-950">Tichet: Activare Cont</div>
                  <div className="text-[11px] text-amber-900/80 font-medium">Buletin, selfie, date curier nou</div>
                </div>
              </button>

              {/* Button 2: Schimbare Autovehicul */}
              <button
                type="button"
                onClick={() => openNewTicketModal("schimbare_vehicul")}
                className="p-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm transition shadow-sm hover:shadow-md flex items-center gap-3 text-left active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-black text-white">Tichet: Schimbare Vehicul</div>
                  <div className="text-[11px] text-purple-200 font-medium">Trecere la mașină / scuter / bicicletă</div>
                </div>
              </button>

              {/* Button 3: Schimbare Numar Telefon */}
              <button
                type="button"
                onClick={() => openNewTicketModal("schimbare_telefon")}
                className="p-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm transition shadow-sm hover:shadow-md flex items-center gap-3 text-left active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-black text-white">Tichet: Schimbare Telefon</div>
                  <div className="text-[11px] text-sky-200 font-medium">Actualizare număr telefon curier</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ADMIN COLLECTOR TABS (for Managerul Coordonator) */}
        {currentUser.role === "admin" && (
          <div className="bg-white p-3 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 pt-1 flex items-center justify-between">
              <span>Filtrare Tichete per Manager:</span>
              <span className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold border border-purple-200">
                Coordonator Central
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {/* Tab Husein */}
              <button
                type="button"
                onClick={() => setAdminActiveTab("husein")}
                className={`flex-1 min-w-[170px] py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  adminActiveTab === "husein"
                    ? "bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-400/40"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
                }`}
              >
                <span className="text-base">👤</span>
                <span>HUSEIN (GlovoWolt)</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/90 text-amber-950 shadow-2xs">
                  {applications.filter((a) => a.recruiter === "glovowolt").length}
                </span>
              </button>

              {/* Tab Ionuț Varga */}
              <button
                type="button"
                onClick={() => setAdminActiveTab("ionutvarga")}
                className={`flex-1 min-w-[170px] py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  adminActiveTab === "ionutvarga"
                    ? "bg-sky-500 text-white shadow-md ring-2 ring-sky-400/40"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
                }`}
              >
                <span className="text-base">👤</span>
                <span>IONUȚ VARGA</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white shadow-2xs">
                  {applications.filter((a) => a.recruiter === "ionutvarga").length}
                </span>
              </button>

              {/* Tab Toate */}
              <button
                type="button"
                onClick={() => setAdminActiveTab("all")}
                className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  adminActiveTab === "all"
                    ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-700"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Toate Tichetele</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white shadow-2xs">
                  {applications.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Tichete</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{filteredApplications.length}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 text-xs font-semibold">
              <span>Noi (În așteptare)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600">
              {filteredApplications.filter((a) => a.status === "nou").length}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-sky-600 text-xs font-semibold">
              <span>În Procesare</span>
              <RefreshCw className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-sky-600">
              {filteredApplications.filter((a) => a.status === "in_lucru").length}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 text-xs font-semibold">
              <span>Respinse (Cu motiv)</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600">
              {filteredApplications.filter((a) => a.status === "respins").length}
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Caută după nume, telefon, email sau oraș..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900 font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            {/* Filter Tip Tichet */}
            <select
              value={ticketTypeFilter}
              onChange={(e) => setTicketTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Toate tipurile de tichete</option>
              <option value="activare_cont">🆕 Activare Cont Curier</option>
              <option value="schimbare_vehicul">🚗 Schimbare Autovehicul</option>
              <option value="schimbare_telefon">📱 Schimbare Telefon</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Toate statusurile</option>
              <option value="nou">🟡 Noi (În așteptare)</option>
              <option value="in_lucru">🔵 În procesare</option>
              <option value="activat">🟢 Finalizat / Activat</option>
              <option value="respins">🔴 Respins</option>
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Toate aplicațiile</option>
              <option value="glovo">Glovo</option>
              <option value="wolt">Wolt</option>
            </select>

            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Toate vehiculele</option>
              <option value="masina">🚗 Mașină</option>
              <option value="scuter">🛵 Scuter</option>
              <option value="bicicleta">🚲 Bicicletă</option>
            </select>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Se încarcă tichetele...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Niciun tichet găsit</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {applications.length === 0
                ? "Nu a fost creat niciun tichet încă. Folosește butoanele de mai sus pentru a deschide primul tichet!"
                : "Niciun rezultat nu corespunde filtrelor selectate."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between"
              >
                {/* Column 1: Ticket & Courier Info */}
                <div className="flex-1 min-w-[280px] space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900">{app.fullName}</h3>

                    {/* Manager Tag */}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        app.recruiter === "glovowolt"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-sky-100 text-sky-900 border border-sky-300"
                      }`}
                    >
                      Manager: {app.recruiter === "glovowolt" ? "Husein (GlovoWolt)" : "Ionuț Varga"}
                    </span>

                    {/* Ticket Type Tag */}
                    {app.ticketType === "schimbare_vehicul" ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-300 flex items-center gap-1">
                        <Car className="w-3 h-3 text-purple-700" />
                        <span>Tichet: Schimbare Autovehicul</span>
                      </span>
                    ) : app.ticketType === "schimbare_telefon" ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold border border-sky-300 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-sky-700" />
                        <span>Tichet: Schimbare Telefon</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1">
                        <span>🆕 Tichet: Activare Cont</span>
                      </span>
                    )}

                    {app.city && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        📍 {app.city}
                      </span>
                    )}

                    <span className="text-xs text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString("ro-RO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* TICKET DETAILS BODY */}
                  {/* Case A: Schimbare Autovehicul */}
                  {app.ticketType === "schimbare_vehicul" ? (
                    <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-purple-900">Modificare Autovehicul:</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-purple-300 text-slate-700 font-semibold line-through">
                          {app.oldVehicleType || "Vehicul Vechi"}
                        </span>
                        <ArrowRight className="w-4 h-4 text-purple-700" />
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-600 text-white font-bold capitalize shadow-2xs">
                          {app.vehicleType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 pt-0.5">
                        <span>📞 Tel curier: <strong>{app.phone}</strong></span>
                        {app.email && <span>✉️ {app.email}</span>}
                      </div>
                    </div>
                  ) : null}

                  {/* Case B: Schimbare Numar Telefon */}
                  {app.ticketType === "schimbare_telefon" ? (
                    <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sky-950">Modificare Număr Telefon:</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-sky-300 text-slate-700 font-semibold line-through">
                          {app.phone}
                        </span>
                        <ArrowRight className="w-4 h-4 text-sky-700" />
                        <span className="px-2.5 py-0.5 rounded-md bg-sky-600 text-white font-bold shadow-2xs">
                          {app.newPhone || "Număr Nou"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 pt-0.5">
                        {app.email && <span>✉️ {app.email}</span>}
                      </div>
                    </div>
                  ) : null}

                  {/* Case C: Standard Activare Cont Contact Details */}
                  {app.ticketType === "activare_cont" || !app.ticketType ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <div className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.phone}</span>
                      </div>

                      {app.email && (
                        <div className="inline-flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.email}</span>
                        </div>
                      )}

                      <div className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {app.vehicleType === "masina" && <Car className="w-3.5 h-3.5" />}
                        {app.vehicleType === "scuter" && <span>🛵</span>}
                        {app.vehicleType === "bicicleta" && <Bike className="w-3.5 h-3.5" />}
                        <span className="capitalize">{app.vehicleType}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Platforms Badges */}
                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    {app.platforms.map((p) => (
                      <span
                        key={p}
                        className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                          p === "glovo"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-sky-100 text-sky-900 border border-sky-300"
                        }`}
                      >
                        {p === "glovo" ? "Glovo" : "Wolt"}
                      </span>
                    ))}
                  </div>

                  {/* PROMINENT REJECTION REASON ALERT (În caz că este respins) */}
                  {app.status === "respins" && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-rose-800 font-bold">Motiv Respingere:</strong>{" "}
                          <span>{app.rejectionReason || "Tichet respins fără motiv specificat"}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRejectModal({
                            open: true,
                            appId: app.id,
                            courierName: app.fullName,
                            reason: app.rejectionReason || "",
                          })
                        }
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0"
                      >
                        Modifică motiv
                      </button>
                    </div>
                  )}

                  {/* Notes if any */}
                  {app.notes && (
                    <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-600 italic">
                      &ldquo;{app.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Column 2: Documents (Buletin, Talon & Poze Vehicul) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Poza Buletin / Talon dacă a fost încărcată */}
                    {app.idCardPhotoUrl ? (
                      <div className="text-center">
                        <div
                          onClick={() =>
                            setPreviewImage({
                              url: app.idCardPhotoUrl!,
                              title: `${app.ticketType === "schimbare_vehicul" ? "Acte / Talon Vehicul" : "Buletin"} - ${app.fullName} (${app.recruiter === "glovowolt" ? "Husein" : "Ionuț Varga"})`,
                            })
                          }
                          className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer group bg-slate-100 border border-slate-200 relative shadow-2xs hover:ring-2 hover:ring-amber-400 transition-all flex items-center justify-center"
                        >
                          {app.idCardPhotoUrl.toLowerCase().includes(".pdf") ||
                          app.idCardPhotoUrl.startsWith("data:application/pdf") ? (
                            <div className="w-full h-full bg-rose-50 flex flex-col items-center justify-center p-1 text-rose-600">
                              <FileText className="w-7 h-7 text-rose-500 mb-0.5" />
                              <span className="text-[10px] font-bold">PDF Document</span>
                            </div>
                          ) : (
                            <img
                              src={app.idCardPhotoUrl}
                              alt="Document 1"
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 block mt-1">
                          {app.ticketType === "schimbare_vehicul" ? "Acte / Talon" : "Poza Buletin"}
                        </span>
                      </div>
                    ) : null}

                    {/* Selfie cu Buletinul / Poză Vehicul dacă a fost încărcat */}
                    {app.selfiePhotoUrl ? (
                      <div className="text-center">
                        <div
                          onClick={() =>
                            setPreviewImage({
                              url: app.selfiePhotoUrl!,
                              title: `${app.ticketType === "schimbare_vehicul" ? "Poză Vehicul" : "Selfie cu buletinul"} - ${app.fullName} (${app.recruiter === "glovowolt" ? "Husein" : "Ionuț Varga"})`,
                            })
                          }
                          className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer group bg-slate-100 border border-slate-200 relative shadow-2xs hover:ring-2 hover:ring-amber-400 transition-all flex items-center justify-center"
                        >
                          {app.selfiePhotoUrl.toLowerCase().includes(".pdf") ||
                          app.selfiePhotoUrl.startsWith("data:application/pdf") ? (
                            <div className="w-full h-full bg-rose-50 flex flex-col items-center justify-center p-1 text-rose-600">
                              <FileText className="w-7 h-7 text-rose-500 mb-0.5" />
                              <span className="text-[10px] font-bold">PDF Document</span>
                            </div>
                          ) : (
                            <img
                              src={app.selfiePhotoUrl}
                              alt="Document 2"
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 block mt-1">
                          {app.ticketType === "schimbare_vehicul" ? "Poză Vehicul" : "Selfie Buletin"}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Buton Încarcă / Actualizează Poze (pentru schimbare vehicul sau completare documente) */}
                  <div className="flex flex-col items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUpdateError("");
                        setPhotoUpdateModal({
                          open: true,
                          appId: app.id,
                          courierName: app.fullName,
                          ticketType: app.ticketType,
                          idCardPhoto: "",
                          selfiePhoto: "",
                        });
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 active:scale-95 ${
                        app.ticketType === "schimbare_vehicul"
                          ? "bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                      title="Încarcă sau actualizează pozele documentelor"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{app.idCardPhotoUrl || app.selfiePhotoUrl ? "Modifică Poze" : "Adaugă Poze"}</span>
                    </button>
                  </div>
                </div>

                {/* Column 3: Actions & Synchronized Status */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 hidden sm:inline">Status:</label>
                    <select
                      value={app.status}
                      onChange={(e) =>
                        handleStatusChange(app.id, e.target.value as ApplicationStatus)
                      }
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none transition cursor-pointer ${
                        app.status === "nou"
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : app.status === "in_lucru"
                          ? "bg-sky-50 text-sky-800 border-sky-300"
                          : app.status === "activat"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-rose-50 text-rose-800 border-rose-300"
                      }`}
                    >
                      <option value="nou">🟡 Nou</option>
                      <option value="in_lucru">🔵 În procesare</option>
                      <option value="activat">🟢 Finalizat / Activat</option>
                      <option value="respins">🔴 Respins</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(app.id, app.fullName)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Șterge tichetul"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL 1: MOTIV RESPINGERE TICHER */}
      {rejectModal && rejectModal.open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRejectModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-rose-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Motiv Respingere Tichet ({rejectModal.courierName})</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                Alege un motiv rapid sau scrie motivul exact pentru care este respins tichetul. Motivul va apărea automat în contul managerului.
              </p>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Buletin neclar / colțuri tăiate",
                  "Buletin expirat",
                  "Selfie neconform (fără buletin în mână)",
                  "Număr de telefon incorect / nu răspunde",
                  "Vehicul indisponibil în zonă",
                  "Cazier / verificare neeligibilă",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setRejectModal((prev) => (prev ? { ...prev, reason: preset } : null))
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 font-medium transition"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descriere motiv respingere *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Scrie motivul detaliat pentru respingere..."
                  value={rejectModal.reason}
                  onChange={(e) =>
                    setRejectModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                  }
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirmă Respingerea</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1.5: ACTUALIZARE POZE / DOCUMENTE VEHICUL SAU BULETIN */}
      {photoUpdateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => !isSavingPhotos && setPhotoUpdateModal(null)}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Încarcă / Actualizează Documente
                  </h3>
                  <p className="text-xs text-slate-500">
                    Curier: <span className="font-bold text-slate-800">{photoUpdateModal.courierName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingPhotos && setPhotoUpdateModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdatedPhotos} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                Atașează documentele necesare (pentru Glovo: talonul sau asigurarea noului vehicul, buletin sau poză vehicul). Se acceptă fișiere JPG, PNG sau PDF.
              </p>

              <div className="space-y-3">
                <ImageUploadField
                  id="update_modal_doc1"
                  label="Document 1 / Talon / Acte Vehicul / Buletin"
                  description="Poză sau fișier PDF cu talonul sau actul de identitate"
                  value={photoUpdateModal.idCardPhoto}
                  onChange={(val) =>
                    setPhotoUpdateModal((prev) => (prev ? { ...prev, idCardPhoto: val } : null))
                  }
                />

                <ImageUploadField
                  id="update_modal_doc2"
                  label="Document 2 / Poză Noul Vehicul / Selfie"
                  description="Poză cu vehiculul sau selfie curier"
                  value={photoUpdateModal.selfiePhoto}
                  onChange={(val) =>
                    setPhotoUpdateModal((prev) => (prev ? { ...prev, selfiePhoto: val } : null))
                  }
                />
              </div>

              {photoUpdateError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{photoUpdateError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingPhotos}
                  onClick={() => setPhotoUpdateModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isSavingPhotos}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSavingPhotos ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Se salvează...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvează Pozele</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREARE TICHET NOU (ACTIVARE CONT / SCHIMBARE VEHICUL / SCHIMBARE TELEFON) */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => !isSubmitting && setIsAddModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {formTicketType === "schimbare_vehicul"
                      ? "Creare Tichet: Schimbare Autovehicul"
                      : formTicketType === "schimbare_telefon"
                      ? "Creare Tichet: Schimbare Număr Telefon"
                      : "Creare Tichet: Activare Cont Curier"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {currentUser.role === "admin"
                      ? "Selectează managerul căruia îi atribui tichetul"
                      : `Se va trimite sub contul tău: @${currentUser.username}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSubmitting && setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* TABS PENTRU ALEGEREA TIPULUI DE TICHET */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Selectează tipul tichetului pe care vrei să îl creezi:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTicketType("activare_cont")}
                    className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 transition ${
                      formTicketType === "activare_cont"
                        ? "border-amber-400 bg-amber-50 text-amber-950 shadow-xs ring-2 ring-amber-400/20"
                        : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span>🆕 Activare Cont</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTicketType("schimbare_vehicul")}
                    className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 transition ${
                      formTicketType === "schimbare_vehicul"
                        ? "border-purple-500 bg-purple-50 text-purple-950 shadow-xs ring-2 ring-purple-500/20"
                        : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span>🚗 Schimbare Vehicul</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTicketType("schimbare_telefon")}
                    className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 transition ${
                      formTicketType === "schimbare_telefon"
                        ? "border-sky-500 bg-sky-50 text-sky-950 shadow-xs ring-2 ring-sky-500/20"
                        : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span>📱 Schimbare Telefon</span>
                  </button>
                </div>
              </div>

              {/* Admin target recruiter selector */}
              {currentUser.role === "admin" && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Atribuie acest tichet managerului:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormTargetRecruiter("glovowolt")}
                      className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        formTargetRecruiter === "glovowolt"
                          ? "border-amber-400 bg-amber-100 text-amber-950 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>👤 Husein (GlovoWolt)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormTargetRecruiter("ionutvarga")}
                      className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        formTargetRecruiter === "ionutvarga"
                          ? "border-sky-500 bg-sky-100 text-sky-950 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>👤 Ionuț Varga</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Platforme (Glovo / Wolt) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Platformă vizată (alege una sau ambele)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => togglePlatform("glovo")}
                    className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all duration-200 relative ${
                      formPlatforms.includes("glovo")
                        ? "border-amber-400 bg-amber-50/50 shadow-xs ring-2 ring-amber-400/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-md text-xs font-black">
                        Glovo
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          formPlatforms.includes("glovo") ? "bg-amber-500 text-white" : "border border-slate-300"
                        }`}
                      >
                        {formPlatforms.includes("glovo") && "✓"}
                      </div>
                    </div>
                    <p className="font-semibold text-xs text-slate-800">Cont Glovo</p>
                  </div>

                  <div
                    onClick={() => togglePlatform("wolt")}
                    className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all duration-200 relative ${
                      formPlatforms.includes("wolt")
                        ? "border-sky-400 bg-sky-50/50 shadow-xs ring-2 ring-sky-400/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-sky-500 text-white rounded-md text-xs font-black">
                        Wolt
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          formPlatforms.includes("wolt") ? "bg-sky-500 text-white" : "border border-slate-300"
                        }`}
                      >
                        {formPlatforms.includes("wolt") && "✓"}
                      </div>
                    </div>
                    <p className="font-semibold text-xs text-slate-800">Cont Wolt</p>
                  </div>
                </div>
              </div>

              {/* CAMPURI SPECIFICE PER TIP TICHET */}

              {/* === CAZ 1: TICHET SCHIMBARE AUTOVEHICUL === */}
              {formTicketType === "schimbare_vehicul" && (
                <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-4">
                  <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-purple-700" />
                    <span>Detalii Schimbare Autovehicul</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nume și Prenume Curier *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Popescu Ion"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Număr telefon curier *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0721 000 000"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Vehiculul ACTUAL (de schimbat):
                      </label>
                      <select
                        value={formOldVehicleType}
                        onChange={(e) => setFormOldVehicleType(e.target.value as VehicleType)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold"
                      >
                        <option value="bicicleta">🚲 Bicicletă</option>
                        <option value="scuter">🛵 Scuter</option>
                        <option value="masina">🚗 Mașină</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        Vehiculul NOU (dorit):
                      </label>
                      <select
                        value={formVehicleType}
                        onChange={(e) => setFormVehicleType(e.target.value as VehicleType)}
                        className="w-full p-2.5 rounded-xl border-2 border-purple-500 bg-white text-purple-950 text-xs font-bold"
                      >
                        <option value="masina">🚗 Mașină</option>
                        <option value="scuter">🛵 Scuter</option>
                        <option value="bicicleta">🚲 Bicicletă</option>
                      </select>
                    </div>
                  </div>

                  {/* Încărcare Poze Acte Vehicul / Buletin (Necesar pentru Glovo) */}
                  <div className="pt-3 border-t border-purple-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-700" />
                        <span>Poze Documente Noul Vehicul / Buletin (Necesar Glovo)</span>
                      </label>
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        {formPlatforms.includes("glovo") ? "Obligatoriu Glovo" : "Opțional"}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-900/80">
                      Pentru Glovo se cer documentele noului autovehicul (talon, asigurare, buletin). Poți încărca fișiere JPG, PNG sau PDF.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ImageUploadField
                        id="modal_vehicul_doc1"
                        label="Document 1 / Talon / Acte Vehicul *"
                        description="Poză sau fișier PDF cu talonul sau actele noului vehicul"
                        value={formIdCardPhoto}
                        onChange={setFormIdCardPhoto}
                        badge={formPlatforms.includes("glovo") ? "Necesar Glovo" : "Opțional"}
                      />
                      <ImageUploadField
                        id="modal_vehicul_doc2"
                        label="Document 2 / Poză Vehicul sau Buletin"
                        description="Poză cu vehiculul, buletinul sau selfie curier"
                        value={formSelfiePhoto}
                        onChange={setFormSelfiePhoto}
                        badge="Opțional"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* === CAZ 2: TICHET SCHIMBARE NUMAR TELEFON === */}
              {formTicketType === "schimbare_telefon" && (
                <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200 space-y-4">
                  <h4 className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-sky-700" />
                    <span>Detalii Schimbare Număr Telefon</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nume și Prenume Curier *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Popescu Ion"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Numărul de telefon VECHI *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="07xx xxx xxx"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-sky-900 mb-1">
                        Numărul de telefon NOU *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="07xx xxx xxx"
                        value={formNewPhone}
                        onChange={(e) => setFormNewPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-sky-500 bg-white text-sky-950 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* === CAZ 3: TICHET STANDARD ACTIVARE CONT NOU === */}
              {formTicketType === "activare_cont" && (
                <div className="space-y-4">
                  {/* Tip Vehicul */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      Tip autovehicul
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFormVehicleType("masina")}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${
                          formVehicleType === "masina"
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <Car className="w-5 h-5" />
                        <span className="text-xs font-semibold">Mașină</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormVehicleType("scuter")}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${
                          formVehicleType === "scuter"
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-lg leading-none">🛵</span>
                        <span className="text-xs font-semibold">Scuter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormVehicleType("bicicleta")}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${
                          formVehicleType === "bicicleta"
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <Bike className="w-5 h-5" />
                        <span className="text-xs font-semibold">Bicicletă</span>
                      </button>
                    </div>
                  </div>

                  {/* Date Contact */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Date de identificare curier
                    </label>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nume și Prenume *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Popescu Ion"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Număr telefon *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0721 000 000"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Adresă email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="curier@exemplu.ro"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Oraș de activitate
                      </label>
                      <input
                        type="text"
                        placeholder="București, Cluj, Timișoara etc."
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  {/* Documente (Buletin & Selfie) */}
                  <div className="space-y-4 pt-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Fotografii Documente (Imagine sau PDF)
                    </label>

                    <ImageUploadField
                      id="modal_buletin"
                      label="Poză Buletin (Carte de Identitate sau PDF)"
                      description="Fotografie clară sau fișier PDF al buletinului curierului."
                      value={formIdCardPhoto}
                      onChange={setFormIdCardPhoto}
                      required
                      badge="Obligatoriu"
                    />

                    <ImageUploadField
                      id="modal_selfie"
                      label="Selfie cu buletinul în mână"
                      description="Selfie clar al curierului ținând buletinul în mână lângă față."
                      value={formSelfiePhoto}
                      onChange={setFormSelfiePhoto}
                      required
                      badge="Obligatoriu"
                    />
                  </div>
                </div>
              )}

              {/* Note / Mentiuni pentru oricare tichet */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Note / Mențiuni suplimentare (Opțional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Scrie detalii suplimentare pentru coordonator..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-900 font-medium resize-none"
                />
              </div>

              {/* Error message */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Se creează tichetul...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Trimite Tichetul</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Resolution Document Preview Modal (Image or PDF) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
              <h3 className="font-bold text-slate-900 text-sm">{previewImage.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  download={
                    previewImage.url.toLowerCase().includes(".pdf") ||
                    previewImage.url.startsWith("data:application/pdf")
                      ? `document_${Date.now()}.pdf`
                      : `document_${Date.now()}.jpg`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descarcă / Deschide</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 flex-1 overflow-auto flex items-center justify-center">
              {previewImage.url.toLowerCase().includes(".pdf") ||
              previewImage.url.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewImage.url}
                  className="w-full h-[75vh] bg-white rounded-lg border-0 shadow-lg"
                  title={previewImage.title}
                />
              ) : (
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
