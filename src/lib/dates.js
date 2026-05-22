export function toDateString(date) {
  if (!(date instanceof Date)) return date
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekRange(weekStart) {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)

  const startDay = start.getDate()
  const endFormatted = end.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
  return `${startDay}–${endFormatted}`
}
