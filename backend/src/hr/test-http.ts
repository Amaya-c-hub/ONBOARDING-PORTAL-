import * as jwt from 'jsonwebtoken';

async function testHttp() {
  // 1. Generate a mock token for MANAGER
  const token = jwt.sign(
    { sub: 'mock-id', email: 'c200118@amayac.work', role: 'manager' },
    'super-secret-jwt-key-change-in-production',
    { expiresIn: '1h' }
  );

  // 2. Hit the endpoint
  const res = await fetch('http://localhost:3001/hr/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      email: 'http-test@test.com',
      firstName: 'HTTP',
      lastName: 'Test'
    })
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Body:', data);
}

testHttp().catch(console.error);
