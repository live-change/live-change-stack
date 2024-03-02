export default  (settings) => (pass) => {
  if(!pass) return
  let digits = /\d/.test(pass)
  let lower = /[a-z]/.test(pass)
  let upper = /[A-Z]/.test(pass)
  let safe = pass.length >= 8 && digits && lower && upper
  if (pass.length >= 15) safe = true
  if (!safe) return "unsafePassword"
}
