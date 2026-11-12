const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

/** Display only: the API returns exact amounts and the browser never does money math. */
export function formatInr(amount: number | string): string {
  return inr.format(Number(amount))
}

const istDate = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** Formats a YYYY-MM-DD string without shifting it through the browser's time zone. */
export function formatDate(isoDate: string): string {
  return istDate.format(new Date(`${isoDate}T00:00:00+05:30`))
}

/** Today's date (YYYY-MM-DD) in IST. */
export function todayIst(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}
