export function getCountdown(target: string | null | undefined, now = Date.now()) {
  if (!target || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(target))
    return null;
  const timestamp = Date.parse(target);
  if (!Number.isFinite(timestamp)) return null;
  const remaining = Math.max(0, Math.ceil((timestamp - now) / 1000));
  return {
    departed: remaining === 0,
    days: Math.floor(remaining / 86400),
    hours: Math.floor((remaining % 86400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
  };
}
