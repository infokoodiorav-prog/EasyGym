let workouts = safeParse(localStorage.getItem("workouts"));

let currentDate =
  localStorage.getItem("currentDate") || formatLocalDate(new Date());

currentDate = formatLocalDate(new Date(currentDate));

function getDayEntry(dateKey) {
  const existing = workouts[dateKey];

  if (Array.isArray(existing)) {
    return { workoutName: "", exercises: existing.filter(Boolean) };
  }

  if (existing && typeof existing === "object") {
    return {
      workoutName: existing.workoutName || "",
      exercises: Array.isArray(existing.exercises)
        ? existing.exercises.filter(Boolean)
        : [],
      _completedPopupShown: existing._completedPopupShown || false,
    };
  }

  return { workoutName: "", exercises: [] };
}

function setDayEntry(dateKey, dayEntry) {
  workouts[dateKey] = {
    workoutName: dayEntry?.workoutName || "",
    exercises: (dayEntry?.exercises || []).filter(Boolean),
    _completedPopupShown: dayEntry?._completedPopupShown || false,
  };

  return workouts[dateKey];
}

function save() {
  localStorage.setItem("workouts", JSON.stringify(workouts));
  localStorage.setItem("currentDate", currentDate);
  localStorage.setItem("workouts", JSON.stringify(workouts));
}
