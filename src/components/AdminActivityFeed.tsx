import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

const ACTION_LABEL: Record<string, string> = {
  "alumni.update": "changed alumni status",
  "alumni.delete": "deleted an alumni profile",
  "alumni.toggle_active": "toggled alumni active status",
  "review.approved": "approved a review",
  "review.rejected": "rejected a review",
  "booking.status_change": "updated a booking",
  "user.role_change": "changed a user's role",
  "platform_stat.update": "updated a platform stat",
};

export async function AdminActivityFeed() {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <Card className="p-6">
      <h2 className="text-[13px] font-semibold text-white">Recent activity</h2>
      <div className="mt-4 space-y-3">
        {logs.length === 0 && <p className="text-xs text-white/30">No recent admin activity.</p>}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 text-xs">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
            <div>
              <p className="text-white/70">
                <span className="font-semibold text-white">{log.adminId.slice(0, 8)}</span>{" "}
                {ACTION_LABEL[log.action] ?? log.action}
              </p>
              <p className="mt-0.5 text-white/30">{log.createdAt.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
