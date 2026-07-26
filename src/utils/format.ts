export const uid = () => crypto.randomUUID()

export const money = (amount: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 }).format(amount)

export const thaiQuantity = (kg: number) => {
  const whole = Math.floor(kg)
  const hectograms = Math.round((kg - whole) * 10)
  return `${whole} กิโล${hectograms ? ` ${hectograms} ขีด` : ''}`
}

export const dateThai = (value: string | Date) =>
  new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export const dateKey = (value = new Date()) => {
  const d = new Date(value)
  return [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('-')
}

/** Round each sale line down to a whole baht. */
export const lineTotal = (quantity: number, price: number) => Math.floor(quantity * price)
