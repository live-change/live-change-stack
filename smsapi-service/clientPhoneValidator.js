export default (settings) => (phone) => {
  const digits = phone.match(/\d/g)
  if (!digits) return "wrongPhone"
  if (digits.length < 9) return "wrongPhone"
  if (digits.length > 11) return "wrongPhone"
  if (!phone.match(/^[0-9 +-]{0,20}$/g)) return "wrongPhone"
}