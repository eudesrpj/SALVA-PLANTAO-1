const pg = require('pg');
const bcrypt = require('bcryptjs');

const newPassword = '123456';
const hashedPassword = bcrypt.hashSync(newPassword, 10);

const client = new pg.Client({
  connectionString: 'postgresql://postgres:Pw@2026SalvaPlantao!prod123@34.39.158.20:5432/salva2?sslmode=allow'
});

client.connect().then(() => {
  console.log('Updating password for eudesrpj@gmail.com');
  return client.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2',
    [hashedPassword, 'eudesrpj@gmail.com']
  );
}).then(result => {
  console.log(`Updated ${result.rowCount} row(s)`);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
