export const digitsOnly = (s?: string) => (s || '').toString().replace(/[^0-9]/g, '')

export const formatVND = (input?: string | number) => {
  const digits = typeof input === 'number' ? String(Math.trunc(input)) : digitsOnly(input)
  if (!digits) return ''
  try {
    const n = Number(digits)
    return n.toLocaleString('vi-VN')
  } catch (e) {
    return digits
  }
}

export const parseVND = (s?: string) => {
  const d = digitsOnly(s)
  if (!d) return 0
  try { return Number(d) } catch { return 0 }
}

export default { digitsOnly, formatVND, parseVND }
