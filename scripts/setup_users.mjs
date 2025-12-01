
async function run() {
  const baseUrl = 'http://127.0.0.1:8788';
  
  const users = [
    { phone: '1000000001', password: 'password123', displayName: 'Admin User', role: 'admin', status: 'active' },
    { phone: '1000000002', password: 'password123', displayName: 'Rider User', role: 'rider', status: 'active' },
    { phone: '1000000003', password: 'password123', displayName: 'Customer User', role: 'customer', status: 'active' },
    { phone: '1000000004', password: 'password123', displayName: 'Blocked Rider', role: 'rider', status: 'blocked' }
  ];

  console.log('--- Registering Users ---');
  for (const user of users) {
    try {
      // 1. Register (or Login if exists)
      let res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, password: user.password, displayName: user.displayName })
      });
      
      let data = await res.json();
      
      if (res.status === 409) {
         // User exists, login instead
         console.log(`User ${user.displayName} exists, logging in...`);
         res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: user.phone, password: user.password })
         });
         data = await res.json();
      }

      if (!res.ok) {
        console.error(`Failed to register/login ${user.displayName}:`, data);
        continue;
      }

      const userId = data.user.id;
      const token = data.token;
      console.log(`[OK] ${user.displayName} (ID: ${userId}) - Token: ${token.substring(0, 10)}...`);
      
      // Save token for later steps if needed (we'll just use the ID for DB updates)
      user.id = userId;
      user.token = token;

    } catch (e) {
      console.error(`Error processing ${user.displayName}:`, e.message);
    }
  }
}

run();
