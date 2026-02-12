"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200";

const statuses = [
  "applied",
  "interviewed",
  "shortlisted",
  "accepted",
  "working",
  "rejected",
] as const;

const pipelineStatuses: Status[] = [
  "applied",
  "interviewed",
  "shortlisted",
  "accepted",
  "working",
];

type Status = (typeof statuses)[number];

type Position = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

type Application = {
  id: string;
  position_id: string | null;
  first_name: string;
  last_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  applicant_fit: string | null;
  status: Status;
  resume_link: string | null;
  resume_path: string | null;
  resume_view_count: number | null;
  resume_last_viewed_at: string | null;
  notes: string | null;
  created_at: string;
};

const formatStatus = (value: Status) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function CareersAdminClient() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<"positions" | "pipeline" | "resumes">(
    "pipeline"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [newPositionDescription, setNewPositionDescription] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(
    null
  );
  const [resumeViewerUrl, setResumeViewerUrl] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newApplicant, setNewApplicant] = useState({
    firstName: "",
    lastName: "",
    positionId: "",
    resumeLink: "",
  });
  const [newApplicantResume, setNewApplicantResume] = useState<File | null>(null);
  const [newApplicantResumeName, setNewApplicantResumeName] = useState<string | null>(
    null
  );
  const [statusLastViewed, setStatusLastViewed] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem("careerStatusViewed") ?? "{}");
    } catch {
      return {};
    }
  });
  const [globalFilter, setGlobalFilter] = useState<{
    role: string;
    range: "all" | "7" | "14" | "30";
  }>({ role: "", range: "all" });
  const notesTimersRef = useRef<Record<string, number>>({});

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) {
      setSessionEmail(null);
      setRole(null);
      setLoading(false);
      return;
    }

    setSessionEmail(session.user.email ?? null);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    setRole(profile?.role ?? null);
    setLoading(false);
  }, [supabase]);

  const loadPositions = useCallback(async () => {
    const { data } = await supabase
      .from("job_positions")
      .select("id,title,description,is_active,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setPositions((data ?? []) as Position[]);
  }, [supabase]);

  const loadApplications = useCallback(async () => {
    const { data } = await supabase
      .from("job_applications")
      .select(
        "id,position_id,first_name,last_name,contact_email,contact_phone,applicant_fit,status,resume_link,resume_path,resume_view_count,resume_last_viewed_at,notes,created_at"
      )
      .order("created_at", { ascending: false });
    setApplications((data ?? []) as Application[]);
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  useEffect(() => {
    if (role !== "admin") return;
    void loadPositions();
    void loadApplications();
  }, [role, loadPositions, loadApplications]);

  const formatAppliedAgo = (value: string) => {
    const created = new Date(value);
    const diffMs = Date.now() - created.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Applied just now";
    if (diffMinutes < 60)
      return `Applied ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Applied today";
    if (diffDays === 1) return "Applied 1 day ago";
    return `Applied ${diffDays} days ago`;
  };

  const markStatusViewed = (status: Status) => {
    const next = { ...statusLastViewed, [status]: new Date().toISOString() };
    setStatusLastViewed(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("careerStatusViewed", JSON.stringify(next));
    }
  };

  const filteredApplications = (status: Status) => {
    const { role, range } = globalFilter;
    return applications.filter((app) => {
      if (app.status !== status) return false;
      if (role && app.position_id !== role) return false;
      if (range !== "all") {
        const created = new Date(app.created_at).getTime();
        const limitDays = Number(range);
        if (Date.now() - created > limitDays * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  };

  const statusNotifications = (status: Status) => {
    const lastViewed = statusLastViewed[status];
    if (!lastViewed) return filteredApplications(status).length;
    const threshold = new Date(lastViewed).getTime();
    return filteredApplications(status).filter(
      (app) => new Date(app.created_at).getTime() > threshold
    ).length;
  };

  const handleAddApplicant = async () => {
    if (!newApplicant.firstName.trim() || !newApplicant.lastName.trim()) return;
    if (!newApplicant.resumeLink.trim() && !newApplicantResume) return;
    setSaving(true);
    setStatusMessage(null);
    let resumePath: string | null = null;
    try {
      if (newApplicantResume) {
        const extension = newApplicantResume.name.split(".").pop() || "pdf";
        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `applications/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, newApplicantResume, { upsert: false });
        if (uploadError) {
          throw uploadError;
        }
        resumePath = filePath;
      }
      const { error } = await supabase.from("job_applications").insert({
        first_name: newApplicant.firstName.trim(),
        last_name: newApplicant.lastName.trim(),
        position_id: newApplicant.positionId || null,
        resume_link: newApplicant.resumeLink.trim() || null,
        resume_path: resumePath,
        status: "applied",
      });
      if (error) {
        throw error;
      }
      setNewApplicant({ firstName: "", lastName: "", positionId: "", resumeLink: "" });
      setNewApplicantResume(null);
      setNewApplicantResumeName(null);
      await loadApplications();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to add applicant.");
    }
    setSaving(false);
  };

  const handleNotesChange = (appId: string, value: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, notes: value } : app))
    );
    if (notesTimersRef.current[appId]) {
      window.clearTimeout(notesTimersRef.current[appId]);
    }
    notesTimersRef.current[appId] = window.setTimeout(() => {
      void handleUpdateApplication(appId, { notes: value });
    }, 600);
  };

  const handleSignIn = async () => {
    setStatusMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatusMessage(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddPosition = async () => {
    if (!newPositionTitle.trim()) return;
    setSaving(true);
    setStatusMessage(null);
    const { error } = await supabase.from("job_positions").insert({
      title: newPositionTitle.trim(),
      description: newPositionDescription.trim() || null,
      is_active: true,
      sort_order: positions.length,
    });
    if (error) {
      setStatusMessage(error.message);
    } else {
      setNewPositionTitle("");
      setNewPositionDescription("");
      await loadPositions();
    }
    setSaving(false);
  };

  const handleUpdatePosition = async (id: string, payload: Partial<Position>) => {
    setSaving(true);
    setStatusMessage(null);
    const { error } = await supabase
      .from("job_positions")
      .update(payload)
      .eq("id", id);
    if (error) {
      setStatusMessage(error.message);
    } else {
      await loadPositions();
    }
    setSaving(false);
  };

  const handleUpdateApplication = async (id: string, payload: Partial<Application>) => {
    setSaving(true);
    setStatusMessage(null);
    const { error } = await supabase
      .from("job_applications")
      .update(payload)
      .eq("id", id);
    if (error) {
      setStatusMessage(error.message);
    } else {
      await loadApplications();
    }
    setSaving(false);
  };

  const handleDownload = async (path: string, appId?: string) => {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 60 * 15);
    if (error) {
      setStatusMessage(error.message);
      return;
    }
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener");
      if (appId) {
        await handleResumeViewed(appId);
      }
    }
  };

  const handleResumeViewed = async (id: string) => {
    const app = applications.find((item) => item.id === id);
    if (!app) return;
    const nextCount = (app.resume_view_count ?? 0) + 1;
    const payload: Partial<Application> = {
      resume_view_count: nextCount,
      resume_last_viewed_at: new Date().toISOString(),
    };
    if (app.status === "applied") {
      payload.status = "interviewed";
    }
    await handleUpdateApplication(id, payload);
  };

  const openResumeViewer = async (app: Application) => {
    if (!app.resume_path) return;
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(app.resume_path, 60 * 15);
    if (error) {
      setStatusMessage(error.message);
      return;
    }
    setResumeViewerUrl(data?.signedUrl ?? null);
    await handleResumeViewed(app.id);
  };

  const positionMap = useMemo(() => {
    return new Map(positions.map((position) => [position.id, position.title]));
  }, [positions]);

  const displayNames = useMemo(() => {
    const map = new Map<string, string>();
    const groups = new Map<string, Application[]>();
    applications.forEach((app) => {
      const key = app.first_name.trim().toLowerCase();
      const existing = groups.get(key) ?? [];
      existing.push(app);
      groups.set(key, existing);
    });

    const cap = (value: string) =>
      value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;

    groups.forEach((apps) => {
      const bucket = new Map<string, Application[]>();
      apps.forEach((app) => {
        const initial = app.last_name.trim().charAt(0).toUpperCase() || "";
        const list = bucket.get(initial) ?? [];
        list.push(app);
        bucket.set(initial, list);
      });

      bucket.forEach((list, initial) => {
        list.forEach((app) => {
          const last = app.last_name.trim();
          const second = last.length > 1 ? last.charAt(1).toUpperCase() : "";
          const suffix = list.length > 1 && second ? `${initial}${second}` : initial;
          const base = cap(app.first_name);
          map.set(app.id, suffix ? `${base} ${suffix}.` : base);
        });
      });
    });

    return map;
  }, [applications]);

  if (loading) {
    return <div className="min-h-screen bg-stone-50 px-6 py-16">Loading...</div>;
  }

  if (!sessionEmail) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-stone-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-stone-900">Career Admin</h1>
          <p className="text-sm text-stone-600">Sign in to manage applicants.</p>
          <input
            className={inputClass}
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
            onClick={handleSignIn}
          >
            Sign in
          </button>
          {statusMessage && <p className="text-sm text-rose-600">{statusMessage}</p>}
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-stone-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-stone-900">Career Admin</h1>
          <p className="text-sm text-stone-600">Signed in as {sessionEmail}.</p>
          <p className="text-sm text-stone-500">
            This account does not have admin access. Update your role in Supabase to
            &quot;admin&quot;.
          </p>
          <button
            className="rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-900"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-10 text-stone-900">
      <div className="mx-auto w-full max-w-[1400px] space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-stone-500">
              Careers
            </p>
            <h1 className="text-3xl font-semibold">Applicant pipeline</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === "pipeline"
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-white"
              }`}
              onClick={() => setActiveTab("pipeline")}
            >
              Pipeline
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === "resumes"
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-white"
              }`}
              onClick={() => setActiveTab("resumes")}
            >
              Resumes
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === "positions"
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-white"
              }`}
              onClick={() => setActiveTab("positions")}
            >
              Positions
            </button>
            <button
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </header>

        {statusMessage && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {statusMessage}
          </p>
        )}

        {activeTab === "pipeline" ? (
          <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                Global filter
              </label>
              <select
                className="rounded-xl border-2 border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                value={globalFilter.role}
                onChange={(event) =>
                  setGlobalFilter((prev) => ({ ...prev, role: event.target.value }))
                }
              >
                <option value="">All roles</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.title}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border-2 border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                value={globalFilter.range}
                onChange={(event) =>
                  setGlobalFilter((prev) => ({
                    ...prev,
                    range: event.target.value as typeof globalFilter.range,
                  }))
                }
              >
                <option value="all">All time</option>
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>
          </section>
        ) : null}

        {activeTab === "positions" ? (
          <section className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow">
            <div>
              <h2 className="text-xl font-semibold">Job positions</h2>
              <p className="text-sm text-stone-500">
                Create and rename positions for the application dropdown.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                className={inputClass}
                placeholder="Add a new position"
                value={newPositionTitle}
                onChange={(event) => setNewPositionTitle(event.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Description"
                value={newPositionDescription}
                onChange={(event) => setNewPositionDescription(event.target.value)}
              />
              <button
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
                onClick={handleAddPosition}
                disabled={saving}
              >
                Add
              </button>
            </div>

            <div className="space-y-4">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3"
                >
              <input
                className={inputClass}
                value={position.title}
                onChange={(event) => {
                  const value = event.target.value;
                  setPositions((prev) =>
                        prev.map((item) =>
                          item.id === position.id ? { ...item, title: value } : item
                        )
                  );
                }}
              />
              <input
                className={inputClass}
                placeholder="Description"
                value={position.description ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setPositions((prev) =>
                    prev.map((item) =>
                      item.id === position.id ? { ...item, description: value } : item
                    )
                  );
                }}
              />
                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    <input
                      type="checkbox"
                      checked={position.is_active}
                      onChange={(event) => {
                        const value = event.target.checked;
                        setPositions((prev) =>
                          prev.map((item) =>
                            item.id === position.id ? { ...item, is_active: value } : item
                          )
                        );
                      }}
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    Order
                    <input
                      className="w-20 rounded-xl border border-stone-200 px-3 py-2 text-sm"
                      type="number"
                      value={position.sort_order ?? 0}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setPositions((prev) =>
                          prev.map((item) =>
                            item.id === position.id ? { ...item, sort_order: value } : item
                          )
                        );
                      }}
                    />
                  </label>
                  <button
                    className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                    onClick={() =>
                      handleUpdatePosition(position.id, {
                        title: position.title,
                        description: position.description,
                        is_active: position.is_active,
                        sort_order: position.sort_order ?? 0,
                      })
                    }
                  >
                    Save
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : activeTab === "pipeline" ? (
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {pipelineStatuses.map((statusKey) => (
                <div
                  key={statusKey}
                  className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id = event.dataTransfer.getData("text/plain");
                    if (!id) return;
                    void handleUpdateApplication(id, { status: statusKey });
                    setDraggingId(null);
                  }}
                >
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{formatStatus(statusKey)}</p>
                      <button
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                          statusNotifications(statusKey)
                            ? "border-amber-300 bg-amber-100 text-amber-900"
                            : "border-stone-200 bg-stone-50 text-stone-500"
                        }`}
                        onClick={() => markStatusViewed(statusKey)}
                      >
                        {statusNotifications(statusKey)}
                      </button>
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                      Filters
                    </div>
                  </div>
                  {statusKey === "applied" ? (
                    <div className="mb-4 space-y-2 rounded-2xl border border-dashed border-stone-200 bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                        Add applicant
                      </p>
                      <input
                        className={inputClass}
                        placeholder="First name"
                        value={newApplicant.firstName}
                        onChange={(event) =>
                          setNewApplicant((prev) => ({
                            ...prev,
                            firstName: event.target.value,
                          }))
                        }
                      />
                      <input
                        className={inputClass}
                        placeholder="Last name"
                        value={newApplicant.lastName}
                        onChange={(event) =>
                          setNewApplicant((prev) => ({
                            ...prev,
                            lastName: event.target.value,
                          }))
                        }
                      />
                      <select
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
                        value={newApplicant.positionId}
                        onChange={(event) =>
                          setNewApplicant((prev) => ({
                            ...prev,
                            positionId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select position</option>
                        {positions.map((position) => (
                          <option key={position.id} value={position.id}>
                            {position.title}
                          </option>
                        ))}
                      </select>
                      <input
                        className={inputClass}
                        placeholder="Resume link"
                        value={newApplicant.resumeLink}
                        onChange={(event) =>
                          setNewApplicant((prev) => ({
                            ...prev,
                            resumeLink: event.target.value,
                          }))
                        }
                      />
                      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
                        <label className="flex cursor-pointer items-center justify-between gap-2">
                          <span>{newApplicantResumeName ?? "Upload resume (PDF or DOC)"}</span>
                          <span className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                            Upload
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              setNewApplicantResume(file);
                              setNewApplicantResumeName(file ? file.name : null);
                            }}
                          />
                        </label>
                      </div>
                      <button
                        className="w-full rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white"
                        onClick={handleAddApplicant}
                        disabled={saving}
                      >
                        Add applicant
                      </button>
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {filteredApplications(statusKey)
                      .sort(
                        (a, b) =>
                          new Date(a.created_at).getTime() -
                          new Date(b.created_at).getTime()
                      )
                      .map((app) => (
                        <article
                          key={app.id}
                          className={`rounded-2xl border bg-white p-4 shadow ${
                            draggingId === app.id
                              ? "border-amber-300 ring-2 ring-amber-100"
                              : "border-stone-200"
                          }`}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", app.id);
                            setDraggingId(app.id);
                          }}
                          onDragEnd={() => setDraggingId(null)}
                          onClick={() => setSelectedApplicationId(app.id)}
                        >
                          <p className="text-sm font-semibold">
                            {displayNames.get(app.id) ?? app.first_name}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                            {formatAppliedAgo(app.created_at)}
                          </p>
                          <p className="text-xs text-stone-500">
                            {positionMap.get(app.position_id ?? "") ?? "Unassigned"}
                          </p>
                          <div className="mt-3 space-y-2">
                            <label className="block text-xs font-semibold text-stone-500">
                              Status
                            </label>
                            <select
                              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
                              value={app.status}
                              onChange={(event) =>
                                handleUpdateApplication(app.id, {
                                  status: event.target.value as Status,
                                })
                              }
                            >
                              {statuses.map((option) => (
                                <option key={option} value={option}>
                                  {formatStatus(option)}
                                </option>
                              ))}
                            </select>
                          </div>
                          {statusKey === "interviewed" ? (
                            <div className="mt-3 flex gap-2">
                              <button
                                className="flex-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleUpdateApplication(app.id, { status: "shortlisted" });
                                }}
                              >
                                Shortlist
                              </button>
                              <button
                                className="flex-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleUpdateApplication(app.id, { status: "rejected" });
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : null}
                          <div className="mt-3 space-y-2">
                            <label className="block text-xs font-semibold text-stone-500">
                              Position
                            </label>
                            <select
                              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
                              value={app.position_id ?? ""}
                              onChange={(event) =>
                                handleUpdateApplication(app.id, {
                                  position_id: event.target.value || null,
                                })
                              }
                            >
                              <option value="">Unassigned</option>
                              {positions.map((position) => (
                                <option key={position.id} value={position.id}>
                                  {position.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-3 space-y-2 text-xs text-stone-500">
                            {app.resume_link ? (
                              <a
                                className="text-amber-700 underline"
                                href={app.resume_link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View resume link
                              </a>
                            ) : null}
                            {app.resume_path ? (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void openResumeViewer(app);
                                  }}
                                >
                                  View resume
                                </button>
                                <button
                                  className="text-amber-700 underline"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDownload(app.resume_path ?? "", app.id);
                                  }}
                                >
                                  Download
                                </button>
                              </div>
                            ) : null}
                            {!app.resume_link && !app.resume_path ? (
                              <p>No resume attached.</p>
                            ) : null}
                          </div>
                          <div className="mt-3 space-y-2">
                            <label className="block text-xs font-semibold text-stone-500">
                              Notes
                            </label>
                            <textarea
                              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
                              rows={3}
                              placeholder="Add notes..."
                              value={app.notes ?? ""}
                              onChange={(event) =>
                                handleNotesChange(app.id, event.target.value)
                              }
                            />
                          </div>
                        </article>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Rejected / Archive</h2>
                  <p className="text-sm text-stone-500">
                    Applications moved to rejected live here.
                  </p>
                </div>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-600">
                  {filteredApplications("rejected").length}
                </span>
              </div>
              {filteredApplications("rejected").length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApplications("rejected")
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((app) => (
                      <article
                        key={app.id}
                        className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", app.id);
                          setDraggingId(app.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onClick={() => setSelectedApplicationId(app.id)}
                      >
                        <p className="text-sm font-semibold">
                          {displayNames.get(app.id) ?? app.first_name}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                          {formatAppliedAgo(app.created_at)}
                        </p>
                        <p className="text-xs text-stone-500">
                          {positionMap.get(app.position_id ?? "") ?? "Unassigned"}
                        </p>
                      </article>
                    ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-stone-500">
                  No rejected applications yet.
                </p>
              )}
            </section>
            {selectedApplicationId ? (
              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow">
                {(() => {
                  const app = applications.find((item) => item.id === selectedApplicationId);
                  if (!app) return null;
                  return (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">
                            {app.first_name} {app.last_name}
                          </p>
                          <p className="text-xs text-stone-500">
                            {positionMap.get(app.position_id ?? "") ?? "Unassigned"}
                          </p>
                        </div>
                        <div className="text-xs text-stone-500">
                          Views: {app.resume_view_count ?? 0}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        {app.resume_link ? (
                          <a
                            className="text-amber-700 underline"
                            href={app.resume_link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Resume link
                          </a>
                        ) : null}
                        {app.resume_path ? (
                          <button
                            className="text-amber-700 underline"
                            onClick={() => void openResumeViewer(app)}
                          >
                            View resume
                          </button>
                        ) : null}
                        <button
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700"
                          onClick={() => handleUpdateApplication(app.id, { status: "rejected" })}
                        >
                          Archive (Reject)
                        </button>
                      </div>
                      {app.applicant_fit ? (
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                            Why they are a good fit
                          </p>
                          <p className="mt-2 whitespace-pre-wrap">{app.applicant_fit}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Resume viewer</h2>
                <p className="text-sm text-stone-500">
                  Select an applicant and view their resume.
                </p>
              </div>
              {resumeViewerUrl ? (
                <button
                  className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                  onClick={() => setResumeViewerUrl(null)}
                >
                  Close
                </button>
              ) : null}
            </div>
            {resumeViewerUrl ? (
              <iframe
                className="h-[70vh] w-full rounded-2xl border border-stone-200"
                src={resumeViewerUrl}
                title="Resume viewer"
              />
            ) : (
              <p className="text-sm text-stone-500">
                No resume selected yet. Use View resume from the pipeline.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
