"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { user, token } = response.data.data;

      // Reject non-admin accounts entirely — never store their token
      if (user.role !== "admin") {
        setError("You are not authorized to access the admin panel.");
        setLoading(false);
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(user));
      router.push("/admin/orders");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.subtitle}>Restaurant management dashboard</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    fontFamily: "sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    width: "320px",
  },
  title: { fontSize: "22px", fontWeight: 700, margin: 0, color: "#1a1a1a" },
  subtitle: { fontSize: "13px", color: "#888", marginTop: 4, marginBottom: 24 },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  error: { color: "#dc2626", fontSize: "13px", marginBottom: "12px" },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
