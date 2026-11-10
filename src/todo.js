export function formatTodoTitle(todo) {
  const title = todo?.title?.trim() ?? '';
  return title === '' ? '無題' : title;
}
