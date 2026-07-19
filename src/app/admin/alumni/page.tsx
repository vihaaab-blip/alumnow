"use client";
import { useEffect, useState, useCallback } from "react";
import { getAllAlumni, updateAlumniProfile, createAlumniProfile, toggleAlumniActive } from "@/actions/admin.actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/components/ui/Toaster";
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/Dialog";
import type { PaginatedResult } from "@/types";

type AdminAlumniExtended = {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  universityName: string;
  course: string;
  country: string;
  graduationYearJbcn: number;
  currentStudyLevel: string;
  bio: string | null;
  languages: string;
  linkedinUrl: string | null;
  verificationStatus: string;
  isVerifiedJbcnAlumnus: boolean;
  isActive: boolean;
  createdAt: Date;
  user: { email: string; phone: string | null };
  sessionTypes: { id: string; type: string; pricePaise: number; maxParticipants: number; descriptionOneLiner: string | null }[];
  availability: { id: string; dayOfWeek: number | null; startTime: string; endTime: string }[];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function PendingReviewCard({ item, onApprove, onReject, onViewDetails }: {
  item: AdminAlumniExtended;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
            {item.profilePhotoUrl ? (
              <img src={item.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/30 text-lg font-bold">
                {item.fullName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{item.fullName}</p>
            <p className="text-xs text-white/40 truncate">{item.user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-white/50">{item.universityName}</span>
              <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-white/50">{item.course}</span>
              <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-white/50">{item.country}</span>
              <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-white/50">Class of {item.graduationYearJbcn}</span>
            </div>
            {item.bio && (
              <p className="mt-2 text-xs text-white/30 line-clamp-2">{item.bio}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={onViewDetails} variant="outline">Details</Button>
          <Button size="sm" onClick={onApprove} className="bg-green-600 hover:bg-green-700 text-white">Accept</Button>
          <Button size="sm" variant="outline" onClick={onReject} className="border-red-500/30 text-red-400 hover:bg-red-500/10">Deny</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAlumniPage() {
  const [data, setData] = useState<PaginatedResult<AdminAlumniExtended> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "toggle" | "approve" | "reject" } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", bio: "", pricePaise: "" });
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<AdminAlumniExtended | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await getAllAlumni({ page: p, pageSize: 20, search: debouncedSearch, status: statusFilter });
      setData(result as any);
    } catch {
      toast({ title: "Failed to load alumni", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { load(page); }, [page, load]);
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const handleCreate = async () => {
    try {
      await createAlumniProfile({ fullName: createForm.fullName, email: createForm.email, bio: createForm.bio || undefined, pricePaise: createForm.pricePaise ? Number(createForm.pricePaise) * 100 : undefined });
      toast({ title: "Alumni created", variant: "success" });
      setCreateOpen(false);
      setCreateForm({ fullName: "", email: "", bio: "", pricePaise: "" });
      load(page);
    } catch { toast({ title: "Failed to create alumni", variant: "error" }); }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateAlumniProfile(id, { verificationStatus: "approved", isVerifiedJbcnAlumnus: true });
      setData((prev) => prev ? { ...prev, items: prev.items.map((row) => row.id === id ? { ...row, verificationStatus: "approved", isVerifiedJbcnAlumnus: true } as any : row) } : prev);
      toast({ title: "Alumni approved — now visible on marketplace", variant: "success" });
      setDetailItem(null);
    } catch { toast({ title: "Failed to approve", variant: "error" }); }
    setConfirmAction(null);
  };

  const handleReject = async (id: string) => {
    try {
      await updateAlumniProfile(id, { verificationStatus: "rejected", isVerifiedJbcnAlumnus: false });
      setData((prev) => prev ? { ...prev, items: prev.items.map((row) => row.id === id ? { ...row, verificationStatus: "rejected", isVerifiedJbcnAlumnus: false } as any : row) } : prev);
      toast({ title: "Alumni rejected — will not appear on marketplace", variant: "success" });
      setDetailItem(null);
    } catch { toast({ title: "Failed to reject", variant: "error" }); }
    setConfirmAction(null);
  };

  const handleToggleActive = async (id: string) => {
    const item = data?.items.find((i) => i.id === id);
    if (!item) return;
    try {
      await toggleAlumniActive(id, !item.isActive);
      setData((prev) => prev ? { ...prev, items: prev.items.map((i) => i.id === id ? { ...i, isActive: !i.isActive } as any : i) } : prev);
      toast({ title: item.isActive ? "Alumni deactivated" : "Alumni activated", variant: "success" });
    } catch { toast({ title: "Failed to update", variant: "error" }); }
    setConfirmAction(null);
  };

  const pendingItems = data?.items.filter((i) => i.verificationStatus === "pending") ?? [];
  const otherItems = data?.items.filter((i) => i.verificationStatus !== "pending") ?? [];

  return (
    <div>
      <Breadcrumbs items={[{ label: "Alumni" }]} />

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Alumni Reviews</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review, approve, or reject mentor applications.</p>
        </div>
        <DialogRoot open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Alumni</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alumni</DialogTitle>
              <DialogDescription>Add a new alumni profile to the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block text-sm font-semibold">Full Name
                <Input value={createForm.fullName} onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))} className="mt-1" />
              </label>
              <label className="block text-sm font-semibold">Email
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} className="mt-1" />
              </label>
              <label className="block text-sm font-semibold">Bio
                <Input value={createForm.bio} onChange={(e) => setCreateForm((f) => ({ ...f, bio: e.target.value }))} className="mt-1" />
              </label>
              <label className="block text-sm font-semibold">Price (₹)
                <Input type="number" value={createForm.pricePaise} onChange={(e) => setCreateForm((f) => ({ ...f, pricePaise: e.target.value }))} className="mt-1" />
              </label>
              <Button className="w-full" onClick={handleCreate}>Create Alumni</Button>
            </div>
          </DialogContent>
        </DialogRoot>
      </div>

      {/* Filters */}
      <div className="mt-6 flex items-center gap-3">
        <Input placeholder="Search by name or bio..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
          {["PENDING", "ALL", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? "bg-primary text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {s === "PENDING" ? "Pending" : s === "ALL" ? "All" : s === "APPROVED" ? "Approved" : "Rejected"}
              {s === "PENDING" && data && (
                <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                  {data.items.filter((i) => i.verificationStatus === "pending").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}

      {/* Pending review cards */}
      {statusFilter === "PENDING" && pendingItems.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Pending Review ({pendingItems.length})</h2>
          {pendingItems.map((item) => (
            <PendingReviewCard
              key={item.id}
              item={item}
              onApprove={() => setConfirmAction({ id: item.id, action: "approve" })}
              onReject={() => setConfirmAction({ id: item.id, action: "reject" })}
              onViewDetails={() => setDetailItem(item)}
            />
          ))}
        </div>
      )}

      {/* Other items table */}
      {otherItems.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-[#1A1A1A]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Alumnus</th>
                <th>University</th>
                <th>Course</th>
                <th>Country</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {otherItems.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-primary">{item.fullName}</p>
                    <p className="text-xs text-muted-foreground">{item.user.email}</p>
                    {item.user.phone && <p className="text-xs text-muted-foreground">{item.user.phone}</p>}
                  </td>
                  <td>{item.universityName}</td>
                  <td>{item.course}</td>
                  <td>{item.country}</td>
                  <td>
                    <Badge tone={item.verificationStatus === "approved" ? "success" : item.verificationStatus === "rejected" ? "danger" : "neutral"}>
                      {item.verificationStatus}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDetailItem(item)}>Details</Button>
                      {item.verificationStatus === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => setConfirmAction({ id: item.id, action: "toggle" })}>
                          {item.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && data && data.items.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-lg text-white/30">No alumni found</p>
          <p className="mt-1 text-sm text-white/20">
            {statusFilter === "PENDING" ? "No pending applications to review." : "Try adjusting your filters."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <DialogRoot open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailItem?.fullName}</DialogTitle>
            <DialogDescription>Full profile details for review</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Email</p>
                  <p className="mt-1">{detailItem.user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Phone</p>
                  <p className="mt-1">{detailItem.user.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">University</p>
                  <p className="mt-1">{detailItem.universityName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Course</p>
                  <p className="mt-1">{detailItem.course}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Graduation Year</p>
                  <p className="mt-1">{detailItem.graduationYearJbcn}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Country</p>
                  <p className="mt-1">{detailItem.country}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Study Level</p>
                  <p className="mt-1">{detailItem.currentStudyLevel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Status</p>
                  <Badge tone={detailItem.verificationStatus === "approved" ? "success" : detailItem.verificationStatus === "rejected" ? "danger" : "neutral"}>
                    {detailItem.verificationStatus}
                  </Badge>
                </div>
              </div>
              {detailItem.bio && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Bio</p>
                  <p className="mt-1 text-sm">{detailItem.bio}</p>
                </div>
              )}
              {detailItem.languages && (() => {
                try {
                  const langs = JSON.parse(detailItem.languages);
                  if (langs.length > 0) return (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Languages</p>
                      <p className="mt-1">{langs.join(", ")}</p>
                    </div>
                  );
                } catch { /* ignore */ }
                return null;
              })()}
              {detailItem.sessionTypes.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Session Types</p>
                  <div className="mt-2 space-y-1">
                    {detailItem.sessionTypes.map((st) => (
                      <div key={st.id} className="flex items-center justify-between text-sm">
                        <span>{st.type.replace("_", " ")} — {st.descriptionOneLiner || "No description"}</span>
                        <span className="font-medium">₹{(st.pricePaise / 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detailItem.availability.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Availability</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailItem.availability.map((a) => (
                      <span key={a.id} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs">
                        {a.dayOfWeek != null ? DAY_NAMES[a.dayOfWeek] : "Specific"} {a.startTime}–{a.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detailItem.verificationStatus === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button onClick={() => setConfirmAction({ id: detailItem.id, action: "approve" })} className="bg-green-600 hover:bg-green-700 text-white">Accept — Approve Profile</Button>
                  <Button variant="outline" onClick={() => setConfirmAction({ id: detailItem.id, action: "reject" })} className="border-red-500/30 text-red-400 hover:bg-red-500/10">Deny — Reject Profile</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </DialogRoot>

      {/* Confirmations */}
      <ConfirmDialog open={confirmAction?.action === "approve"} onOpenChange={() => setConfirmAction(null)} onConfirm={() => confirmAction && handleApprove(confirmAction.id)} title="Approve this alumni?" description="They will appear on the public marketplace and students can book sessions with them." confirmLabel="Approve" />
      <ConfirmDialog open={confirmAction?.action === "reject"} onOpenChange={() => setConfirmAction(null)} onConfirm={() => confirmAction && handleReject(confirmAction.id)} title="Reject this alumni?" description="They will not appear on the marketplace. This action can be reversed later." confirmLabel="Reject" variant="destructive" />
      <ConfirmDialog open={confirmAction?.action === "toggle"} onOpenChange={() => setConfirmAction(null)} onConfirm={() => confirmAction && handleToggleActive(confirmAction.id)} title="Toggle alumni status" description="Are you sure you want to change this alumni's active status?" confirmLabel="Confirm" variant="destructive" />
    </div>
  );
}
