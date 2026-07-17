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
import type { AdminAlumniItem, PaginatedResult } from "@/types";

export default function AdminAlumniPage() {
  const [data, setData] = useState<PaginatedResult<AdminAlumniItem> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "toggle" } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", bio: "", pricePaise: "" });
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    load(page);
  }, [page, load]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const startEdit = (item: AdminAlumniItem) => {
    setEditingId(item.id);
    setEditValues({
      fullName: item.fullName,
      bio: item.bio ?? "",
      universityName: item.universityName,
      course: item.course,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateAlumniProfile(id, editValues);
      setData((prev) => prev ? { ...prev, items: prev.items.map((i) => i.id === id ? { ...i, ...editValues } as any : i) } : prev);
      setEditingId(null);
      toast({ title: "Alumni updated", variant: "success" });
    } catch {
      toast({ title: "Failed to update alumni", variant: "error" });
    }
  };

  const handleToggleActive = async (id: string) => {
    const item = data?.items.find((i) => i.id === id);
    if (!item) return;
    try {
      await toggleAlumniActive(id, !item.isActive);
      setData((prev) => prev ? { ...prev, items: prev.items.map((i) => i.id === id ? { ...i, isActive: !i.isActive } as any : i) } : prev);
      toast({ title: item.isActive ? "Alumni deactivated" : "Alumni activated", variant: "success" });
    } catch {
      toast({ title: "Failed to update alumni", variant: "error" });
    }
    setConfirmAction(null);
  };

  const handleCreate = async () => {
    try {
      await createAlumniProfile({
        fullName: createForm.fullName,
        email: createForm.email,
        bio: createForm.bio || undefined,
        pricePaise: createForm.pricePaise ? Number(createForm.pricePaise) * 100 : undefined,
      });
      toast({ title: "Alumni created", variant: "success" });
      setCreateOpen(false);
      setCreateForm({ fullName: "", email: "", bio: "", pricePaise: "" });
      load(page);
    } catch {
      toast({ title: "Failed to create alumni", variant: "error" });
    }
  };

  const handleApproveReject = async (item: AdminAlumniItem) => {
    const next = item.verificationStatus === "approved" ? "rejected" : "approved";
    try {
      await updateAlumniProfile(item.id, {
        verificationStatus: next,
        isVerifiedJbcnAlumnus: next === "approved",
      });
      setData((prev) => prev ? { ...prev, items: prev.items.map((row) => row.id === item.id ? { ...row, verificationStatus: next } as any : row) } : prev);
      toast({ title: next === "approved" ? "Alumni approved" : "Alumni rejected", variant: "success" });
    } catch {
      toast({ title: "Failed to update verification status", variant: "error" });
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: "Alumni" }]} />
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Alumni directory</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review verification and visibility for every mentor.</p>
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

      <div className="mt-6 flex items-center gap-3">
        <Input
          placeholder="Search by name or bio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-[10px] border border-border bg-[#1A1A1A] px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option value="ALL">All statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-[#1A1A1A]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Alumnus</th>
              <th>University</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="p-4">
                  {editingId === item.id ? (
                    <Input
                      value={editValues.fullName}
                      onChange={(e) => setEditValues((v) => ({ ...v, fullName: e.target.value }))}
                      className="mb-1"
                    />
                  ) : (
                    <p className="font-semibold text-primary">{item.fullName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{item.user.email}</p>
                </td>
                <td>
                  {editingId === item.id ? (
                    <Input
                      value={editValues.universityName}
                      onChange={(e) => setEditValues((v) => ({ ...v, universityName: e.target.value }))}
                    />
                  ) : (
                    <span>{item.universityName}</span>
                  )}
                </td>
                <td>
                  <Badge tone={item.verificationStatus === "approved" ? "success" : item.verificationStatus === "rejected" ? "danger" : "neutral"}>
                    {item.verificationStatus}
                  </Badge>
                </td>
                <td>
                  <Badge tone={item.isActive ? "success" : "danger"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td>
                  <div className="flex gap-2">
                    {editingId === item.id ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(item.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(item)}>Edit</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleApproveReject(item)}>
                      {item.verificationStatus === "approved" ? "Reject" : "Approve"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmAction({ id: item.id, action: "toggle" })}>
                      {item.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!data || data.items.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                  {loading ? "Loading..." : "No alumni found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleToggleActive(confirmAction.id)}
        title="Toggle alumni status"
        description="Are you sure you want to change this alumni's active status?"
        confirmLabel="Confirm"
        variant="destructive"
      />
    </div>
  );
}
