import bcrypt from 'bcrypt';
async function test() {
  const hash = '$2b$10$4VWnz0cOyLbzcNZxGcUI9OdU3mOF5ddhZ2W2xuvxwcEu6wJ1MP8Jm';
  const match = await bcrypt.compare('superadmin123', hash);
  console.log('Match superadmin123?', match);
  const match2 = await bcrypt.compare('123456', hash);
  console.log('Match 123456?', match2);
  process.exit();
}
test();
