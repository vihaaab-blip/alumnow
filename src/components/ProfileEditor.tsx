"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Camera, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, updateProfilePhoto } from "@/actions/alumni-profile.actions";

interface ProfileEditorProps {
  initial: {
    fullName: string;
    universityName: string;
    course: string;
    country: string;
    graduationYearJbcn: number;
    currentStudyLevel: string;
    bio: string | null;
    languages: string[];
    linkedinUrl: string | null;
    profilePhotoUrl: string | null;
  };
}

export function ProfileEditor({ initial }: ProfileEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [form, setForm] = useState({
    fullName: initial.fullName,
    universityName: initial.universityName,
    course: initial.course,
    country: initial.country,
    graduationYearJbcn: initial.graduationYearJbcn,
    currentStudyLevel: initial.currentStudyLevel,
    bio: initial.bio ?? "",
    languages: initial.languages.join(", "),
    linkedinUrl: initial.linkedinUrl ?? "",
  });
  const [photoUrl, setPhotoUrl] = useState(initial.profilePhotoUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile({
      ...form,
      languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
      graduationYearJbcn: Number(form.graduationYearJbcn),
    });
    setLoading(false);
    if (result.success) {
      toast.success("Profile updated");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update profile");
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    const result = await updateProfilePhoto(fd);
    setPhotoUploading(false);
    if (result.success && result.data?.url) {
      setPhotoUrl(result.data.url);
      toast.success("Photo updated");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to upload photo");
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-primary">Profile photo</h2>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-3xl font-semibold">
                {initial.fullName.charAt(0)}
              </div>
            )}
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted">
              <Camera size={16} />
              Upload photo
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-primary">Basic information</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Full name</label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">University</label>
            <Input value={form.universityName} onChange={(e) => setForm({ ...form, universityName: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Course</label>
            <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Country</label>
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Graduation year</label>
            <Input type="number" value={form.graduationYearJbcn} onChange={(e) => setForm({ ...form, graduationYearJbcn: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Study level</label>
            <select
              value={form.currentStudyLevel}
              onChange={(e) => setForm({ ...form, currentStudyLevel: e.target.value })}
              className="h-11 w-full rounded-[10px] border border-border bg-[#1A1A1A] px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              maxLength={750}
              className="h-24 w-full resize-none rounded-[10px] border border-border bg-[#1A1A1A] px-3.5 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Languages (comma-separated)</label>
            <Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">LinkedIn URL</label>
            <Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </motion.form>
  );
}
