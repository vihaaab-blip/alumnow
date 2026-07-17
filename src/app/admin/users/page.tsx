"use client";
import { useEffect, useState, useCallback } from "react";
import { getAllUsers } from "@/actions/admin.actions";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "@/components/ui/Toaster";
import type { AdminUserItem, PaginatedResult } from "@/types";

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResult<AdminUserItem> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await getAllUsers({ page: p, pageSize: 20, search: debouncedSearch, role: roleFilter });
      setData(result as any);
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage all platform users.</p>
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
          className="h-11 rounded-[10px] border border-border bg-[#1A1A1A] px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option value="ALL">All roles</option>
          <option value="student">Student</option>
          <option value="alumnus">Alumni</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-[#1A1A1A]">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="p-4 font-semibold text-primary">
                  {user.studentProfile?.fullName ?? user.alumniProfile?.fullName ?? "—"}
                </td>
                <td>{user.email}</td>
                <td>
                  <Badge tone={user.role === "admin" ? "accent" : user.role === "alumnus" ? "success" : "neutral"}>
                    {user.role}
                  </Badge>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!data || data.items.length === 0) && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                  {loading ? "Loading..." : "No users found."}
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
    </div>
  );
}
