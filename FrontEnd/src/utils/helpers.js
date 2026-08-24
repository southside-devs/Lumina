export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) { return dateStr; }
}
export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return Number(num).toLocaleString("en-IN");
}
export function getRiskColor(score) {
  const s = parseFloat(score);
  if (s >= 80) return "var(--danger)";
  if (s >= 60) return "var(--warning)";
  if (s >= 30) return "#ffcc00";
  return "var(--success)";
}
export function getRiskLabel(score) {
  const s = parseFloat(score);
  if (s >= 80) return "Critical";
  if (s >= 60) return "High";
  if (s >= 30) return "Medium";
  return "Low";
}
export function paginate(array, page_size, page_number) {
  return array.slice((page_number - 1) * page_size, page_number * page_size);
}
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
