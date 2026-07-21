"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getAccountData,
  updateAccountName,
  changePassword,
  updateAccountPhone,
} from "@/actions/account.actions";
import {
  User, Mail, Phone, Lock, Shield, Calendar, GraduationCap,
  Save, Loader2, Eye, EyeOff, ArrowRight, Building2, BookOpen, Check,
} from "lucide-react";

interface AccountData {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
  name: string;
  hasPassword: boolean;
  profilePhotoUrl: string | null;
  studentGrade: string | null;
  school: string | null;
  alumniUniversity: string | null;
}

const inputDark =
  "bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-coral/50 focus:ring-coral/10";

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[16px] bg-[#1A1A1A] border border-white/5 p-6 ${className}`}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-white/40">
      {children}
    </label>
  );
}

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountData | null>(null);

  const [nameForm, setNameForm] = useState({ fullName: "" });
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [phoneForm, setPhoneForm] = useState({ phone: "" });
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const load = useCallback(async () => {
    const res = await getAccountData();
    if (res.success && res.data) {
      const d = res.data;
      setAccount(d);
      setNameForm({ fullName: d.name });
      setPhoneForm({ phone: d.phone ?? "" });
    } else {
      toast.error(res.error ?? "Failed to load account");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { router.push("/login"); return; }
    load();
  }, [session, router, load]);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    const res = await updateAccountName(nameForm);
    setNameSaving(false);
    if (res.success) {
      setNameSaved(true);
      toast.success("Name updated");
      await updateSession();
      setTimeout(() => setNameSaved(false), 2000);
    } else {
      toast.error(res.error ?? "Failed to update name");
    }
  }

  async function handlePhoneSave(e: React.FormEvent) {
    e.preventDefault();
    setPhoneSaving(true);
    const res = await updateAccountPhone(phoneForm);
    setPhoneSaving(false);
    if (res.success) {
      setPhoneSaved(true);
      toast.success("Phone updated");
      setTimeout(() => setPhoneSaved(false), 2000);
    } else {
      toast.error(res.error ?? "Failed to update phone");
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setPwSaving(true);
    const res = await changePassword(pwForm);
    setPwSaving(false);
    if (res.success) {
      setPwSaved(true);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
      setTimeout(() => setPwSaved(false), 2000);
    } else {
      toast.error(res.error ?? "Failed to change password");
    }
  }

  const roleBadge = (role: string) => {
    const map: Record<string, { label: string; color: string }> = {
      student: { label: "Student", color: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20" },
      alumnus: { label: "Alumni", color: "bg-[#E8573A]/10 text-[#E8573A] border-[#E8573A]/20" },
      admin: { label: "Admin", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20" },
    };
    const info = map[role] ?? { label: "Student", color: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20" };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${info.color}`}>
        <Shield size={10} />
        {info.label}
      </span>
    );
  };

  if (loading || !account) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
          <Skeleton className="h-8 w-48 rounded-[10px]" />
          <Skeleton className="h-[120px] rounded-[16px]" />
          <Skeleton className="h-[200px] rounded-[16px]" />
          <Skeleton className="h-[200px] rounded-[16px]" />
        </div>
      </div>
    );
  }

  const initials = account.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E8573A] mb-1">Account</p>
          <h1 className="text-[28px] font-bold text-white tracking-[-0.02em]">Your profile & settings</h1>
          <p className="text-[13px] text-white/40 mt-1">Manage your personal information and security.</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <SectionCard className="mt-8">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                {account.profilePhotoUrl ? (
                  <img
                    src={account.profilePhotoUrl}
                    alt={account.name}
                    className="h-[72px] w-[72px] rounded-[16px] border-2 border-white/10 object-cover shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                  />
                ) : (
                  <div className="h-[72px] w-[72px] rounded-[16px] bg-gradient-to-br from-[#E8573A]/20 to-[#E8573A]/5 border-2 border-white/10 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <span className="text-[28px] font-bold text-[#E8573A]/60">{initials}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[20px] font-bold text-white tracking-[-0.01em]">{account.name}</h2>
                <p className="text-[13px] text-white/40 mt-0.5">{account.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {roleBadge(account.role)}
                  {account.alumniUniversity && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-white/30">
                      <Building2 size={10} /> {account.alumniUniversity}
                    </span>
                  )}
                  {account.studentGrade && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-white/30">
                      <BookOpen size={10} /> {account.studentGrade} · {account.school}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/5">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider mb-1">
                  <Calendar size={10} /> Member since
                </div>
                <p className="text-[13px] font-semibold text-white">
                  {new Date(account.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider mb-1">
                  <Mail size={10} /> Email
                </div>
                <p className="text-[13px] font-semibold text-white truncate">{account.email}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider mb-1">
                  <Phone size={10} /> Phone
                </div>
                <p className="text-[13px] font-semibold text-white">{account.phone ?? "Not set"}</p>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Edit Name */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <SectionCard className="mt-4">
            <div className="flex items-center gap-2 mb-5">
              <User size={16} className="text-white/40" />
              <h3 className="text-[14px] font-semibold text-white">Personal information</h3>
            </div>
            <form onSubmit={handleNameSave} className="space-y-4">
              <div>
                <FieldLabel>Full name</FieldLabel>
                <div className="flex gap-3">
                  <Input
                    value={nameForm.fullName}
                    onChange={(e) => setNameForm({ fullName: e.target.value })}
                    required
                    className={inputDark}
                  />
                  <Button
                    type="submit"
                    disabled={nameSaving || nameForm.fullName.length < 2}
                    className="shrink-0 bg-[#E8573A] text-white hover:bg-[#D44A2E] rounded-[10px] px-5 h-11 text-[13px] font-semibold transition-all duration-150 disabled:opacity-40"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {nameSaved ? (
                        <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                          <Check size={14} /> Saved
                        </motion.span>
                      ) : nameSaving ? (
                        <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                          <Loader2 size={14} className="animate-spin" /> Saving
                        </motion.span>
                      ) : (
                        <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                          <Save size={14} /> Save
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>
            </form>
          </SectionCard>
        </motion.div>

        {/* Phone */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <SectionCard className="mt-4">
            <div className="flex items-center gap-2 mb-5">
              <Phone size={16} className="text-white/40" />
              <h3 className="text-[14px] font-semibold text-white">Contact</h3>
            </div>
            <form onSubmit={handlePhoneSave} className="space-y-4">
              <div>
                <FieldLabel>Phone number</FieldLabel>
                <div className="flex gap-3">
                  <Input
                    value={phoneForm.phone}
                    onChange={(e) => setPhoneForm({ phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className={inputDark}
                  />
                  <Button
                    type="submit"
                    disabled={phoneSaving || !phoneForm.phone}
                    className="shrink-0 bg-[#E8573A] text-white hover:bg-[#D44A2E] rounded-[10px] px-5 h-11 text-[13px] font-semibold transition-all duration-150 disabled:opacity-40"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {phoneSaved ? (
                        <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                          <Check size={14} /> Saved
                        </motion.span>
                      ) : phoneSaving ? (
                        <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                          <Loader2 size={14} className="animate-spin" /> Saving
                        </motion.span>
                      ) : (
                        <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                          <Save size={14} /> Save
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>
            </form>
          </SectionCard>
        </motion.div>

        {/* Change Password */}
        {account.hasPassword && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <SectionCard className="mt-4">
              <div className="flex items-center gap-2 mb-5">
                <Lock size={16} className="text-white/40" />
                <h3 className="text-[14px] font-semibold text-white">Security</h3>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <FieldLabel>Current password</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showCurrentPw ? "text" : "password"}
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      required
                      className={inputDark + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>New password</FieldLabel>
                    <div className="relative">
                      <Input
                        type={showNewPw ? "text" : "password"}
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        required
                        minLength={8}
                        className={inputDark + " pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Confirm new password</FieldLabel>
                    <Input
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      required
                      className={inputDark}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword.length < 8}
                    className="bg-white/10 text-white hover:bg-white/15 border border-white/10 rounded-[10px] px-5 h-11 text-[13px] font-semibold transition-all duration-150 disabled:opacity-40"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {pwSaved ? (
                        <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                          <Check size={14} /> Changed
                        </motion.span>
                      ) : pwSaving ? (
                        <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                          <Loader2 size={14} className="animate-spin" /> Changing
                        </motion.span>
                      ) : (
                        <motion.span key="change" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                          <Lock size={14} /> Change password
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </form>
            </SectionCard>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <SectionCard className="mt-4">
            <div className="flex items-center gap-2 mb-5">
              <GraduationCap size={16} className="text-white/40" />
              <h3 className="text-[14px] font-semibold text-white">Quick links</h3>
            </div>
            <div className="space-y-1">
              {account.role === "alumnus" && (
                <>
                  <a href="/alumni/profile" className="flex items-center justify-between p-3 -mx-3 rounded-[10px] hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-[8px] bg-[#E8573A]/10 flex items-center justify-center">
                        <User size={14} className="text-[#E8573A]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-white">Edit alumni profile</p>
                        <p className="text-[11px] text-white/30">Bio, university, availability</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                  </a>
                  <a href="/alumni/profile/availability" className="flex items-center justify-between p-3 -mx-3 rounded-[10px] hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-[8px] bg-[#3B82F6]/10 flex items-center justify-center">
                        <Calendar size={14} className="text-[#3B82F6]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-white">Manage availability</p>
                        <p className="text-[11px] text-white/30">Set your schedule</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                  </a>
                </>
              )}
              <a href="/dashboard" className="flex items-center justify-between p-3 -mx-3 rounded-[10px] hover:bg-white/[0.03] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-[8px] bg-white/5 flex items-center justify-center">
                    <GraduationCap size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">Dashboard</p>
                    <p className="text-[11px] text-white/30">Your overview & analytics</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </a>
              <a href="/browse" className="flex items-center justify-between p-3 -mx-3 rounded-[10px] hover:bg-white/[0.03] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-[8px] bg-white/5 flex items-center justify-center">
                    <BookOpen size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">Browse marketplace</p>
                    <p className="text-[11px] text-white/30">Find alumni mentors</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </a>
            </div>
          </SectionCard>
        </motion.div>

        {/* Bottom spacing */}
        <div className="h-16" />
      </div>
    </div>
  );
}
