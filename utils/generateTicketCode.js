export async function generateUniqueTicketCode() {
  let code;
  let exists = true;

  while (exists) {
    code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const existing = await OrderModel.findOne({ ticketCode: code });
    if (!existing) exists = false;
  }

  return code;
}
