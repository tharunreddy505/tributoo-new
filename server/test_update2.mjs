import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const token = jwt.sign(
    { id: 3, role: 'superadmin', is_super_admin: true, username: 'admin' },
    'tributto_secret_key', // This is what is defined in index.js for process.env.JWT_SECRET if fallback, oh wait it uses process.env.JWT_SECRET
    { expiresIn: '7d' }
);

fetch('http://localhost:5000/api/tributes/52', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ name: 'Testing' })
})
    .then(r => r.json().catch(() => r.text()))
    .then(console.log)
    .catch(console.error);
