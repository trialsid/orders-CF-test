
async function run() {
  const baseUrl = 'http://127.0.0.1:8788';
  
  // Credentials
  const creds = {
    admin: { phone: '1000000001', password: 'password123' },
    rider: { phone: '1000000002', password: 'password123' },
    customer: { phone: '1000000003', password: 'password123' },
    blockedRider: { phone: '1000000004', password: 'password123' }
  };

  const tokens = {};
  const users = {};

  // 1. Login Helper
  async function login(role, cred) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cred)
    });
    if (!res.ok) throw new Error(`Login failed for ${role}: ${res.status}`);
    const data = await res.json();
    tokens[role] = data.token;
    users[role] = data.user;
    console.log(`[LOGIN] ${role} logged in. ID: ${data.user.id}`);
  }

  // 2. Initialize
  console.log('--- Step 1: Logging in ---');
  await login('admin', creds.admin);
  await login('rider', creds.rider);
  await login('customer', creds.customer);
  // We don't login blocked rider, we just need their ID which we can get from the admin user list or hardcode if we knew it.
  // Actually, let's login blocked rider just to get the ID, even if they are blocked? 
  // Wait, blocked users can't login usually.
  // I'll fetch the blocked rider's ID via the Admin API.
  
  console.log('--- Step 2: Fetching Blocked Rider ID ---');
  const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { 'Authorization': `Bearer ${tokens.admin}` }
  });
  const usersData = await usersRes.json();
  const blockedRiderObj = usersData.users.find(u => u.phone === creds.blockedRider.phone);
  if (!blockedRiderObj) throw new Error('Blocked rider not found in DB');
  users.blockedRider = blockedRiderObj;
  console.log(`[INFO] Blocked Rider ID: ${users.blockedRider.id}`);

  // 3. Create Orders
  console.log('--- Step 3: Creating Orders ---');
  async function createOrder(items) {
    const res = await fetch(`${baseUrl}/api/order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.customer}`
      },
      body: JSON.stringify({
        items,
        customer: {
            name: 'Test Customer',
            phone: '1000000003',
            address: '123 Test Lane'
        },
        delivery: {
            slot: 'Tomorrow'
        },
        payment: {
            method: 'cash'
        }
      })
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Create order failed: ${txt}`);
    }
    const data = await res.json();
    return data.orderId;
  }

  // We need valid product IDs. I'll pick one from the seed data (e.g., 'PACS0024' from the context or I can just guess if validation is loose, but it checks DB).
  // The seed data in 0007_seed_products.sql has 'PACS0024'.
  const orderId1 = await createOrder([{ id: 'PACS0024', quantity: 2 }]);
  console.log(`[ORDER] Created Order 1: ${orderId1}`);
  
  const orderId2 = await createOrder([{ id: 'PACS0024', quantity: 2 }]);
  console.log(`[ORDER] Created Order 2 (Unassigned): ${orderId2}`);


  // 4. Admin Assigns Rider to Order 1
  console.log('--- Step 4: Admin Assigns Rider ---');
  const assignRes = await fetch(`${baseUrl}/api/order`, {
    method: 'PATCH',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.admin}`
    },
    body: JSON.stringify({
      orderId: orderId1,
      riderId: users.rider.id
    })
  });
  if (!assignRes.ok) throw new Error(`Assignment failed: ${assignRes.status}`);
  console.log(`[SUCCESS] Assigned Order 1 to Rider.`);


  // 5. Rider Verification (Happy Path)
  console.log('--- Step 5: Rider Verification (Happy Path) ---');
  
  // 5a. List Orders
  const riderListRes = await fetch(`${baseUrl}/api/order`, {
    headers: { 'Authorization': `Bearer ${tokens.rider}` }
  });
  const riderList = await riderListRes.json();
  const foundOrder1 = riderList.orders.find(o => o.id === orderId1);
  const foundOrder2 = riderList.orders.find(o => o.id === orderId2);
  
  if (foundOrder1) console.log('[PASS] Rider sees assigned Order 1 in list.');
  else console.error('[FAIL] Rider CANNOT see assigned Order 1.');

  if (!foundOrder2) console.log('[PASS] Rider does NOT see unassigned Order 2 in list.');
  else console.error('[FAIL] Rider Sees unassigned Order 2.');

  // 5b. Get Details
  const riderDetailRes = await fetch(`${baseUrl}/api/order?id=${orderId1}`, {
    headers: { 'Authorization': `Bearer ${tokens.rider}` }
  });
  if (riderDetailRes.ok) console.log('[PASS] Rider can fetch details for Order 1.');
  else console.error(`[FAIL] Rider detail fetch failed: ${riderDetailRes.status}`);

  // 5c. Update Status
  const statusRes = await fetch(`${baseUrl}/api/order`, {
    method: 'PATCH',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.rider}`
    },
    body: JSON.stringify({
      orderId: orderId1,
      status: 'outForDelivery'
    })
  });
  if (statusRes.ok) console.log('[PASS] Rider updated status of Order 1.');
  else console.error(`[FAIL] Rider status update failed: ${statusRes.status}`);


  // 6. Security Checks (Negative Tests)
  console.log('--- Step 6: Security Checks ---');

  // 6a. Rider fetches unassigned order details
  const unassignedDetailRes = await fetch(`${baseUrl}/api/order?id=${orderId2}`, {
    headers: { 'Authorization': `Bearer ${tokens.rider}` }
  });
  if (unassignedDetailRes.status === 404 || unassignedDetailRes.status === 403) {
      console.log(`[PASS] Rider correctly denied access to unassigned Order 2 (Status: ${unassignedDetailRes.status})`);
  } else {
      console.error(`[FAIL] Rider accessed unassigned order! Status: ${unassignedDetailRes.status}`);
  }

  // 6b. Rider updates unassigned order
  const unassignedUpdateRes = await fetch(`${baseUrl}/api/order`, {
    method: 'PATCH',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.rider}`
    },
    body: JSON.stringify({
      orderId: orderId2,
      status: 'delivered'
    })
  });
  if (unassignedUpdateRes.status === 404 || unassignedUpdateRes.status === 403) {
      console.log(`[PASS] Rider correctly denied update on unassigned Order 2 (Status: ${unassignedUpdateRes.status})`);
  } else {
      console.error(`[FAIL] Rider updated unassigned order! Status: ${unassignedUpdateRes.status}`);
  }

  // 6c. Admin assigns Blocked Rider
  const blockedAssignRes = await fetch(`${baseUrl}/api/order`, {
    method: 'PATCH',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.admin}`
    },
    body: JSON.stringify({
      orderId: orderId2,
      riderId: users.blockedRider.id
    })
  });
  
  if (blockedAssignRes.status === 400) {
      const err = await blockedAssignRes.json();
      console.log(`[PASS] Admin blocked from assigning inactive rider. Error: "${err.error}"`);
  } else {
      console.error(`[FAIL] Admin assigned blocked rider! Status: ${blockedAssignRes.status}`);
  }

}

run();
