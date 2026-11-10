import { createServer } from 'node:http';

const PORT = 3000;
const HTTP_STATUS = { OK: 200, NOT_FOUND: 404 };

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

function respondToRequest(request, response) {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, HTTP_STATUS.OK, { status: 'ok' });
    return;
  }

  sendJson(response, HTTP_STATUS.NOT_FOUND, { error: '見つかりません' });
}

createServer(respondToRequest).listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`http://127.0.0.1:${PORT}\n`);
});
