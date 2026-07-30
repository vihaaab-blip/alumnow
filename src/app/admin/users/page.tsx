"use client";
import { useEffect, useState, useCallback } from "react";
import { getAllUsers, updateUserRole } from "@/actions/admin.actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "@/components/ui/Toaster";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserActivitySummary } from "@/components/UserActivitySummary";
import type { AdminUserItem, PaginatedResult } from "@/types";

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResult<AdminUserItem> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ id: string; newRole: string } | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;
    try {
      await updateUserRole(roleChangeTarget.id, roleChangeTarget.newRole);
      setData((prev) => prev ? { ...prev, items: prev.items.map((u) => u.id === roleChangeTarget.id ? { ...u, role: roleChangeTarget.newRole } as any : u) } : prev);
      toast({ title: "Role updated", variant: "success" });
    } catch {
      toast({ title: "Failed to update role", variant: "error" });
    }
    setRoleChangeTarget(null);
  };

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await getAllUsers({ page: p, pageSize: 20, search: debouncedSearch, role: roleFilter });
      setData(result);
    } catch {
      toast({ title: "Failed to load users", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    load(page);
  }, [page, load]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Users" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Accounts</p>
          <h1 className="mt-2 text-[32px] font-bold tracking-tight text-white">Users</h1>
          <p className="mt-2 text-sm text-white/40">Every account on the alumnow. platform, students and alumni alike.</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 rounded-[10px] border border-white/10 bg-white/[0.02] px-3.5 text-sm text-white outline-none focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
        >
          <option value="ALL">All roles</option>
          <option value="student">Student</option>
          <option value="alumnus">Alumni</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-white/35">
            <tr>
              <th className="p-4">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((user) => (
              <><tr onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)} className="border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.02] cursor-pointer">
                <td className="p-4 font-semibold text-white">
                  {user.studentProfile?.fullName ?? user.alumniProfile?.fullName ?? "—"}
                </td>
                <td className="text-white/50">{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => setRoleChangeTarget({ id: user.id, newRole: e.target.value })}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                  >
                    <option value="student">Student</option>
                    <option value="alumnus">Alumni</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="text-white/50">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            {expandedUser === user.id && (
              <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                <td colSpan={4} className="p-4">
                  <UserActivitySummary userId={user.id} />
                </td>
              </tr>
            )}
              </>
            ))}
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.06]">
                  <td className="p-4"><div className="h-4 w-28 rounded-[6px] bg-white/10 animate-pulse" /></td>
                  <td><div className="h-4 w-40 rounded-[6px] bg-white/10 animate-pulse" /></td>
                  <td><div className="h-5 w-20 rounded-full bg-white/10 animate-pulse" /></td>
                  <td><div className="h-4 w-24 rounded-[6px] bg-white/10 animate-pulse" /></td>
                </tr>
              ))
            ) : (!data || data.items.length === 0) && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm text-white/40">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-white/40">
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
        open={!!roleChangeTarget}
        onOpenChange={() => setRoleChangeTarget(null)}
        onConfirm={handleRoleChange}
        title="Change user role?"
        description={`This grants ${roleChangeTarget?.newRole} permissions immediately.`}
        confirmLabel="Confirm"
        variant="destructive"
      />
    </div>
  );
}
