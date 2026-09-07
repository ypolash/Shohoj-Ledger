async function test() {
  const payload = {
    customerName: "Test",
    customerCode: "",
    primaryContactPerson: "Test",
    phone: "015",
    email: "",
    groupId: "",
    creditLimit: "5000",
    currency: "BDT",
    paymentTerms: "Net 30",
    billingAddress: "Jessore",
    shippingAddress: "Jessore",
    binNo: "",
    tinNo: "",
    registrationNo: ""
  };
  
  const res = await fetch('http://localhost:3000/api/crm/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'next-auth.session-token=mock' // We don't have a real cookie, so this will fail Auth
    },
    body: JSON.stringify(payload)
  });
  
  console.log(res.status, await res.text());
}
test();
