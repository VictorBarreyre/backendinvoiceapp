const argon2 = require('argon2');

async function testPasswordHandling() {
  const password = 'test123';
  const hashed = await argon2.hash(password);
  console.log('Hashed:', hashed);
  
  const isMatch = await argon2.verify(hashed, password);
  console.log('Match:', isMatch); // Doit être true
}

testPasswordHandling();
