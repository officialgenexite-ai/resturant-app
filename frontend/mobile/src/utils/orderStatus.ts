export function getStatusColor(status: string): string {
  switch (status) {
    case "Pending": return "#f59e0b";
    case "Preparing": return "#3b82f6";
    case "Out for Delivery": return "#8b5cf6";
    case "Delivered": return "#16a34a";
    case "Cancelled": return "#dc2626";
    default: return "#888";
  }
}
