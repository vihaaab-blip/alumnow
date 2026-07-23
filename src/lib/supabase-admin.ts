const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
};

export async function createUserWithAdmin(opts: {
  email: string;
  password: string;
  user_metadata?: Record<string, unknown>;
}): Promise<{ id: string; email: string } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: opts.email,
        password: opts.password,
        email_confirm: true,
        user_metadata: opts.user_metadata,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Admin createUser failed:", res.status, body);
      return null;
    }
    const data = await res.json();
    return { id: data.id, email: data.email };
  } catch (err) {
    console.error("createUserWithAdmin error:", err);
    return null;
  }
}

export async function confirmUserEmail(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ email_confirm: true }),
    });
    return res.ok;
  } catch (err) {
    console.error("confirmUserEmail failed:", err);
    return false;
  }
}
