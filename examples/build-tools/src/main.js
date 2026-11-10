import { formatTodoTitle } from './todo.js';

const todos = [{ title: ' 牛乳を買う ' }, {}];

for (const todo of todos) {
  process.stdout.write(`${formatTodoTitle(todo)}\n`);
}
