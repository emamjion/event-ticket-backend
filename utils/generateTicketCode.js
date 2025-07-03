export function generateTicketCode() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString(); // 12-digit
}
