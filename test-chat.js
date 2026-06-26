const fs = require('fs');
async function test() {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', Buffer.from('This is a test document.'), { filename: 'test.txt', contentType: 'text/plain' });
  form.append('message', 'What is this document about?');
  
  const res = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    body: form
  });
  
  const text = await res.text();
  console.log('Status', res.status);
  console.log('Response:', text);
}
test().catch(console.error);
