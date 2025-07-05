export function formatExpiry(dateString?: string): string {
  if (!dateString) return "";

  const expiryDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 6) return `${diffDays} days`;

  // 1-4 weeks
  if (diffDays <= 28) {
    const diffWeeks = Math.round(diffDays / 7);
    return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""}`;
  }

  // 1-11 months
  if (diffDays < 365) {
    const diffMonths = Math.round(diffDays / 30.44);
    if (diffMonths >= 12) {
      return `1 year`;
    }
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  }

  // 1+ years
  const diffYears = Math.round(diffDays / 365.25);
  return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
}

export function getExpiryStatus(days: number | undefined): string {
  if (days === undefined) return "";
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}
