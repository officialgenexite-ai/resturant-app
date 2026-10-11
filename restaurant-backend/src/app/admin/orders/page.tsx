"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface OrderUser {
  name: string;
  phone: string;
  email: string;
}

interface PendingOrder {
  _id: string;
  user: OrderUser;
  total: number;
  paymentMethod: string;
  transactionId?: string;
  paymentScreenshot?: string;
  ocrStatus: string;
  ocrChecks?: {
    accountMatched: boolean;
    amountMatched: boolean;
    timeWithinWindow: boolean;
    tidMatched: boolean;
  };
  createdAt: string;
  status?: string;
}

const POLL_INTERVAL_MS = 12000;

export default function AdminOrdersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<PendingOrder[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const knownOrderIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Auth guard ---
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  // --- Ask for browser notification permission once --
  useEffect(() => {
    if (ready && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [ready]);

  // --- Fetch Pending Orders ---
  const fetchPendingOrders = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await axios.get("/api/admin/orders/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const freshOrders: PendingOrder[] = response.data.data.orders;

      const newOnes = freshOrders.filter((o) => !knownOrderIds.current.has(o._id));

      if (newOnes.length > 0 && knownOrderIds.current.size > 0) {
        audioRef.current?.play().catch(() => {});

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New order pending review", {
            body: `${newOnes.length} new order(s) awaiting verification.`,
          });
        }
      }

      knownOrderIds.current = new Set(freshOrders.map((o) => o._id));
      setOrders(freshOrders);
    } catch (err) {
      console.error("Failed to fetch pending orders:", err);
    }
  }, []);

  // --- Fetch Active Orders ---
  const fetchActiveOrders = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await axios.get("/api/admin/orders/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveOrders(response.data.data.orders);
    } catch (err) {
      console.error("Failed to fetch active orders:", err);
    }
  }, []);

  // --- Polling Effect ---
  useEffect(() => {
    if (!ready) return;
    fetchPendingOrders();
    fetchActiveOrders();

    const interval = setInterval(() => {
      fetchPendingOrders();
      fetchActiveOrders();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [ready, fetchPendingOrders, fetchActiveOrders]);

  // --- COD Orders Accept Handler ---
  async function handleAcceptCod(orderId: string) {
    const token = localStorage.getItem("adminToken");
    setProcessingId(orderId);

    try {
      await axios.patch(
        `/api/orders/${orderId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      knownOrderIds.current.delete(orderId);
      fetchActiveOrders();
    } catch (err) {
      console.error("Failed to accept order:", err);
      alert("Failed to accept order. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }

  // --- JazzCash Verification Handler ---
  async function handleDecision(orderId: string, decision: "approved" | "rejected") {
    const token = localStorage.getItem("adminToken");
    setProcessingId(orderId);

    try {
      await axios.patch(
        `/api/orders/${orderId}/verify-payment`,
        { decision },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      knownOrderIds.current.delete(orderId);
      if (decision === "approved") {
        fetchActiveOrders();
      }
    } catch (err) {
      console.error("Failed to update order:", err);
      alert("Failed to update order. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }

  // --- Active Order Status Handler ---
  async function handleAdvanceStatus(orderId: string, newStatus: string) {
    const token = localStorage.getItem("adminToken");
    setProcessingId(orderId);

    try {
      await axios.patch(
        `/api/orders/${orderId}/status`,
        { newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchActiveOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status.");
    } finally {
      setProcessingId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/admin/login");
  }

  if (!ready) return null;

  return (
    <div style={styles.page}>
      <audio ref={audioRef} src="/sounds/notification-bell.mp3" preload="auto" />

      <div style={styles.header}>
        <h1 style={styles.title}>Pending Payment Verifications</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>

      {orders.length === 0 ? (
        <p style={styles.emptyText}>No orders awaiting review. New orders will appear here automatically.</p>
      ) : (
        <div style={styles.grid}>
          {orders.map((order) => (
            <div key={order._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</span>
                <span style={styles.total}>Rs. {order.total}</span>
              </div>

              <p style={styles.detailLine}><strong>Customer:</strong> {order.user?.name} ({order.user?.phone})</p>
              <p style={styles.detailLine}><strong>Payment:</strong> {order.paymentMethod}</p>

              {order.paymentMethod === "JazzCash" ? (
                <>
                  <p style={styles.detailLine}><strong>TID:</strong> {order.transactionId || "N/A"}</p>
                  
                  {order.ocrStatus !== "not_applicable" && (
                    <p style={styles.detailLine}>
                      <strong>OCR Status:</strong>{" "}
                      <span style={{ color: order.ocrStatus === "verified" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                        {order.ocrStatus}
                      </span>
                    </p>
                  )}

                  {order.ocrChecks && (
                    <div style={styles.checksRow}>
                      <CheckBadge label="Account" passed={order.ocrChecks.accountMatched} />
                      <CheckBadge label="Amount" passed={order.ocrChecks.amountMatched} />
                      <CheckBadge label="Time" passed={order.ocrChecks.timeWithinWindow} />
                      <CheckBadge label="TID" passed={order.ocrChecks.tidMatched} />
                    </div>
                  )}

                  {order.paymentScreenshot && (
                    <img
                      src={order.paymentScreenshot}
                      alt="Payment screenshot"
                      style={styles.thumbnail}
                      onClick={() => setEnlargedImage(order.paymentScreenshot!)}
                    />
                  )}

                  <div style={styles.actions}>
                    <button style={styles.approveButton} disabled={processingId === order._id} onClick={() => handleDecision(order._id, "approved")}>
                      Approve
                    </button>
                    <button style={styles.rejectButton} disabled={processingId === order._id} onClick={() => handleDecision(order._id, "rejected")}>
                      Reject
                    </button>
                  </div>
                </>
              ) : (
                <div style={styles.actions}>
                  <button style={styles.acceptButton} disabled={processingId === order._id} onClick={() => handleAcceptCod(order._id)}>
                    Accept Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- Active Orders Section --- */}
      <h1 style={{ ...styles.title, marginTop: "32px" }}>Active Orders (In Progress)</h1>
      {activeOrders.length === 0 ? (
        <p style={styles.emptyText}>No orders currently in the kitchen or on the way.</p>
      ) : (
        <div style={styles.grid}>
          {activeOrders.map((order) => (
            <div key={order._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</span>
                <span style={styles.total}>Rs. {order.total}</span>
              </div>
              <p style={styles.detailLine}><strong>Customer:</strong> {order.user?.name} ({order.user?.phone})</p>
              <p style={styles.detailLine}><strong>Status:</strong> {order.status}</p>
              <div style={styles.actions}>
                {order.status === "Preparing" && (
                  <button
                    style={styles.acceptButton}
                    disabled={processingId === order._id}
                    onClick={() => handleAdvanceStatus(order._id, "Out for Delivery")}
                  >
                    Mark Out for Delivery
                  </button>
                )}
                {order.status === "Out for Delivery" && (
                  <button
                    style={styles.approveButton}
                    disabled={processingId === order._id}
                    onClick={() => handleAdvanceStatus(order._id, "Delivered")}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {enlargedImage && (
        <div style={styles.modalOverlay} onClick={() => setEnlargedImage(null)}>
          <img src={enlargedImage} alt="Full screenshot" style={styles.modalImage} />
        </div>
      )}
    </div>
  );
}

function CheckBadge({ label, passed }: { label: string; passed: boolean }) {
  return (
    <span style={{ ...styles.badge, backgroundColor: passed ? "#dcfce7" : "#fee2e2", color: passed ? "#16a34a" : "#dc2626" }}>
      {passed ? "✓" : "✗"} {label}
    </span>
  );
}

// --- Styles Object ---
const styles: Record<string, React.CSSProperties> = {
  page: { padding: "24px", fontFamily: "sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#1a1a1a", margin: 0 },
  logoutButton: { padding: "8px 16px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" },
  emptyText: { color: "#888", fontSize: "14px", marginTop: "8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px", marginTop: "12px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  orderId: { fontWeight: 700, fontSize: "14px" },
  total: { fontWeight: 700, fontSize: "16px", color: "#f97316" },
  detailLine: { fontSize: "13px", color: "#444", margin: "4px 0" },
  checksRow: { display: "flex", flexWrap: "wrap", gap: "6px", margin: "10px 0" },
  badge: { fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "12px" },
  thumbnail: { width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", marginTop: "8px", cursor: "pointer" },
  actions: { display: "flex", gap: "8px", marginTop: "12px" },
  approveButton: { flex: 1, padding: "10px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 },
  rejectButton: { flex: 1, padding: "10px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 },
  acceptButton: { flex: 1, padding: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 1000 },
  modalImage: { maxWidth: "90%", maxHeight: "90%", borderRadius: "8px" },
};
