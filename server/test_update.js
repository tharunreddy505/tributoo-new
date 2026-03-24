const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/tributes/52',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ' + token
    }
};

const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.on('error', e => console.error(e));
req.write(JSON.stringify({ name: "Testing error" }));
req.end();
