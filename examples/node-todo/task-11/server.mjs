import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const PORT = 3000;
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};
const DATA_DIRECTORY = new URL('./data/', import.meta.url);
const DATA_FILE = new URL('./data/todos.json', import.meta.url);
let todos = await loadTodos();

async function loadTodos() {
  try {
    const savedTodos = JSON.parse(await readFile(DATA_FILE, 'utf8'));
    if (!Array.isArray(savedTodos)) {
      throw new Error('保存ファイルはTODOの配列にしてください');
    }
    return savedTodos;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function commitTodos(nextTodos) {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(nextTodos)}\n`, 'utf8');
  todos = nextTodos;
}

async function respondToRequest(request, response) {
  try {
    if (request.method === 'GET' && (request.url === '/' || request.url === '/app.js')) {
      const isHtml = request.url === '/';
      const fileUrl = new URL(
        isHtml ? './public/index.html' : './public/app.js',
        import.meta.url,
      );
      const content = await readFile(fileUrl);
      response.writeHead(HTTP_STATUS.OK, {
        'Content-Type': isHtml
          ? 'text/html; charset=utf-8'
          : 'text/javascript; charset=utf-8',
      });
      response.end(content);
      return;
    }

    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, HTTP_STATUS.OK, { status: 'ok' });
      return;
    }

    if (request.method === 'GET' && request.url === '/todos') {
      sendJson(response, HTTP_STATUS.OK, todos);
      return;
    }

    if (request.method === 'POST' && request.url === '/todos') {
      const body = await readJsonBody(request);
      if (typeof body?.title !== 'string' || body.title.trim() === '') {
        sendJson(response, HTTP_STATUS.BAD_REQUEST, { error: 'titleを入力してください' });
        return;
      }
      const todo = {
        id: randomUUID(),
        title: body.title.trim(),
        completed: false,
      };
      await commitTodos([...todos, todo]);
      sendJson(response, HTTP_STATUS.CREATED, todo);
      return;
    }

    const todoPath = request.url?.match(/^\/todos\/([^/]+)$/);
    if (todoPath && (request.method === 'PATCH' || request.method === 'DELETE')) {
      const todoId = todoPath[1];
      const todo = todos.find((candidate) => candidate.id === todoId);
      if (!todo) {
        sendJson(response, HTTP_STATUS.NOT_FOUND, { error: 'TODOが見つかりません' });
        return;
      }

      if (request.method === 'PATCH') {
        const body = await readJsonBody(request);
        if (typeof body?.completed !== 'boolean') {
          sendJson(response, HTTP_STATUS.BAD_REQUEST, { error: 'completedはtrueかfalseです' });
          return;
        }
        const updatedTodo = { ...todo, completed: body.completed };
        await commitTodos(todos.map((candidate) => (
          candidate.id === todoId ? updatedTodo : candidate
        )));
        sendJson(response, HTTP_STATUS.OK, updatedTodo);
        return;
      }

      await commitTodos(todos.filter((candidate) => candidate.id !== todoId));
      response.writeHead(HTTP_STATUS.NO_CONTENT);
      response.end();
      return;
    }

    sendJson(response, HTTP_STATUS.NOT_FOUND, { error: '見つかりません' });
  } catch (error) {
    const statusCode = error instanceof SyntaxError
      ? HTTP_STATUS.BAD_REQUEST
      : HTTP_STATUS.INTERNAL_ERROR;
    const message = error instanceof SyntaxError
      ? 'JSONを読み取れません'
      : '処理に失敗しました';
    sendJson(response, statusCode, { error: message });
  }
}

createServer(respondToRequest).listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`http://127.0.0.1:${PORT}\n`);
});
