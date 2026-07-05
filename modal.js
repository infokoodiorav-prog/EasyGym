const modal = document.getElementById("modal");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");
const closeBtn = document.getElementById("closeBtn");

const nameInput = document.getElementById("name");
const weightInput = document.getElementById("weight");
const setsInput = document.getElementById("sets");
const repsInput = document.getElementById("reps");

const workoutNameInput = document.getElementById("workoutName");
const workoutNameWrap = document.getElementById("workoutNameWrap");

function updateWorkoutNameVisibility() {
  const dayEntry = getDayEntry(currentDate);
  const shouldShow = !dayEntry.workoutName;

  if (workoutNameWrap) {
    workoutNameWrap.classList.toggle("hidden", !shouldShow);
  }

  if (!shouldShow) {
    workoutNameInput.value = "";
  }
}

addBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  updateWorkoutNameVisibility();
});

closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

saveBtn.addEventListener("click", () => {
  const setsCount = Number(setsInput.value);
  const setsArray = [];

  for (let i = 0; i < setsCount; i++) {
    setsArray.push({
      plannedReps: Number(repsInput.value),
      actualReps: null,
      weight: Number(weightInput.value),
      done: null,
    });
  }

  const dayEntry = getDayEntry(currentDate);
  const workoutName = workoutNameInput.value.trim();

  if (!dayEntry.workoutName && workoutName) {
    dayEntry.workoutName = workoutName;
  }

  const exercise = {
    name: nameInput.value,
    open: true,
    sets: setsArray,
  };

  dayEntry.exercises.push(exercise);
  setDayEntry(currentDate, dayEntry);

  save();
  modal.classList.add("hidden");
  clearInputs();
  render();
});

function clearInputs() {
  nameInput.value = "";
  weightInput.value = "";
  setsInput.value = "";
  repsInput.value = "";
  workoutNameInput.value = "";
}
