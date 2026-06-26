import fs from 'fs';

// Write a mock text file
fs.writeFileSync('test.txt', 'This is a secure test file with some important information about AI Course Generator.');

// Create form logic
const boundary = '----WebKitFormBoundary7x9yZ';
let body = '';

// Add file part
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="file"; filename="test.txt"\r\n`;
body += `Content-Type: text/plain\r\n\r\n`;
body += fs.readFileSync('test.txt', 'utf8') + '\r\n';

// Add message part
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="message"\r\n\r\n`;
body += `What is this file about?\r\n`;
body += `--${boundary}--\r\n`;

fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
})
    .then(res => res.json())
    .then(data => {
        console.log('Upload Result:', JSON.stringify(data, null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
