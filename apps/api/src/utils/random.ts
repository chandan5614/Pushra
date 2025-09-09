export function randomCode(len = 9) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

export function randomOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

