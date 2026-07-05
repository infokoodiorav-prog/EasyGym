function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeParse(data) {
  try {
    return JSON.parse(data) || {};
  } catch {
    return {};
  }
}
function isExerciseCompleted(ex) {
  return ex.sets.every((set) => set.done !== null);
}
