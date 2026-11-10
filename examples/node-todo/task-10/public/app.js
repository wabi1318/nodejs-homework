const form = document.querySelector('#todo-form');
const titleInput = document.querySelector('#todo-title');
const errorMessage = document.querySelector('#error');
const todoList = document.querySelector('#todo-list');
const HTTP_NO_CONTENT = 204;

async function requestJson(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const problem = await response.json();
    throw new Error(problem.error ?? '通信に失敗しました');
  }
  return response.status === HTTP_NO_CONTENT ? null : response.json();
}

async function runTodoAction(action) {
  errorMessage.textContent = '';
  try {
    await action();
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

async function renderTodos() {
  const todos = await requestJson('/todos');
  todoList.replaceChildren();
  for (const todo of todos) {
    const item = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => runTodoAction(async () => {
      await requestJson(`/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: checkbox.checked }),
      });
      await renderTodos();
    }));
    const title = document.createElement('span');
    title.textContent = todo.title;
    label.append(checkbox, title);
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '削除';
    deleteButton.addEventListener('click', () => runTodoAction(async () => {
      await requestJson(`/todos/${todo.id}`, { method: 'DELETE' });
      await renderTodos();
    }));
    item.append(label, deleteButton);
    todoList.append(item);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void runTodoAction(async () => {
    await requestJson('/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleInput.value }),
    });
    titleInput.value = '';
    await renderTodos();
  });
});

void runTodoAction(renderTodos);
