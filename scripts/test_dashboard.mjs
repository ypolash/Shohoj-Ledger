async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/finance/dashboard', {
      headers: {
        'Cookie': 'next-auth.session-token=123' // Fake token to see what it throws
      }
    });
    console.log("Status:", res.status);
    console.log(await res.text());
  } catch(e) {
    console.error(e);
  }
}
test();
