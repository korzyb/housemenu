export function toDateString(date) {
  return date instanceof Date ? date.toISOString().split('T')[0] : date
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
