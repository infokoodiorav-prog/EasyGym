const list = document.getElementById("list");
let completionPopup = null;
let dialogPopup = null;

function hideCompletionPopup() {
  if (completionPopup) {
    completionPopup.classList.add("hidden");
  }
}

function hideDialogPopup() {
  if (dialogPopup) {
    dialogPopup.classList.add("hidden");
  }
}

function showDialogPopup({
  title,
  message,
  confirmText = "OK",
  cancelText = null,
  inputPlaceholder = "",
  onConfirm,
  onCancel,
}) {
  if (!dialogPopup) {
    dialogPopup = document.createElement("div");
    dialogPopup.className = "completion-popup hidden";
    document.body.appendChild(dialogPopup);

    dialogPopup.addEventListener("click", (event) => {
      if (event.target === dialogPopup) {
        hideDialogPopup();
      }
    });
  }

  dialogPopup.innerHTML = `
    <div class="completion-popup__content">
      <h3>${title}</h3>
      <p>${message}</p>
      ${inputPlaceholder ? `<input class="completion-popup__input" placeholder="${inputPlaceholder}" />` : ""}
      <div class="completion-popup__actions">
        <button id="confirmDialogBtn">${confirmText}</button>
        ${cancelText ? `<button id="cancelDialogBtn">${cancelText}</button>` : ""}
      </div>
    </div>
  `;

  dialogPopup.classList.remove("hidden");

  dialogPopup.querySelector("#confirmDialogBtn").onclick = () => {
    const inputEl = dialogPopup.querySelector(".completion-popup__input");
    const value = inputEl ? inputEl.value.trim() : null;
    hideDialogPopup();
    onConfirm?.(value);
  };

  const cancelBtn = dialogPopup.querySelector("#cancelDialogBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      hideDialogPopup();
      onCancel?.();
    };
  }
}

function showCompletionPopup() {
  if (!completionPopup) {
    completionPopup = document.createElement("div");
    completionPopup.className = "completion-popup hidden";
    completionPopup.innerHTML = `
      <div class="completion-popup__content">
        <h3>Treening on lõpetatud 🎉</h3>
        <p>Kas soovid selle treeningu järgmisesse nädalasse kaasa võtta?</p>
        <div class="completion-popup__actions">
          <button id="carryNextWeekBtn">Jah</button>
          <button id="closePopupBtn">Ei</button>
        </div>
      </div>
    `;

    document.body.appendChild(completionPopup);

    completionPopup.querySelector("#carryNextWeekBtn").onclick = () => {
      carryWorkoutForward();
      hideCompletionPopup();
    };

    completionPopup.querySelector("#closePopupBtn").onclick =
      hideCompletionPopup;

    completionPopup.addEventListener("click", (event) => {
      if (event.target === completionPopup) {
        hideCompletionPopup();
      }
    });
  }

  completionPopup.classList.remove("hidden");
}

function checkWorkoutCompletion() {
  const dayEntry = getDayEntry(currentDate);
  const dayExercises = dayEntry.exercises.filter(Boolean);

  if (!dayExercises.length) return;

  const allCompleted = dayExercises.every(
    (ex) => ex?.sets && ex.sets.every((set) => set.done !== null),
  );

  if (allCompleted) {
    if (!dayEntry._completedPopupShown) {
      dayEntry._completedPopupShown = true;
      setDayEntry(currentDate, dayEntry);
      save();
      showCompletionPopup();
    }
  } else {
    dayEntry._completedPopupShown = false;
    setDayEntry(currentDate, dayEntry);
    save();
  }
}

function carryWorkoutForward() {
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 7);
  const nextKey = formatLocalDate(nextDate);

  const dayEntry = getDayEntry(currentDate);
  const copiedWorkout = JSON.parse(
    JSON.stringify(dayEntry.exercises.filter(Boolean)),
  );

  copiedWorkout.forEach((ex) => {
    ex.open = true;
    ex.userToggled = false;

    ex.sets.forEach((set) => {
      set.done = null;
      set.actualReps = null;
    });
  });

  setDayEntry(nextKey, {
    workoutName: dayEntry.workoutName || "",
    exercises: copiedWorkout,
    _completedPopupShown: false,
  });

  dayEntry._completedPopupShown = false;
  setDayEntry(currentDate, dayEntry);
  save();
  render();

  showDialogPopup({
    title: "Valmis! 🎉",
    message: "Treening kopeeriti edukalt järgmisesse nädalasse ✅",
    confirmText: "OK",
  });
}

function render() {
  list.innerHTML = "";

  const dayEntry = getDayEntry(currentDate);
  const dayData = dayEntry.exercises.filter(Boolean);

  if (dayData.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    emptyState.innerHTML = `
      <i data-lucide="dumbbell"></i>
      <h2>Täna pole veel ühtegi harjutust</h2>
      <p>Vajuta "Lisa uus harjutus", et alustada.</p>
    `;

    list.appendChild(emptyState);

    lucide.createIcons();

    return;
  }

  if (dayEntry.workoutName) {
    const workoutTitle = document.createElement("div");
    workoutTitle.className = "workout-title";
    workoutTitle.textContent = dayEntry.workoutName;
    list.appendChild(workoutTitle);
  }

  dayData.forEach((ex, exIndex) => {
    if (!ex?.sets) return;

    const completed = isExerciseCompleted(ex);

    if (typeof ex.open !== "boolean") {
      ex.open = true;
    }

    if (completed && !ex.userToggled) {
      ex.open = false;
    }

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const left = document.createElement("div");
    left.className = "card-left";

    const setsContainer = document.createElement("div");
    setsContainer.className = "sets";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = ex.open ? "▼" : "▶";
    toggleBtn.className = "toggleBtn";
    toggleBtn.onclick = () => {
      ex.open = !ex.open;
      ex.userToggled = true;
      save();
      render();
    };

    const title = document.createElement("h3");
    title.textContent = ex.name || "Unnamed";
    title.style.cursor = "pointer";
    title.title = "Klõpsa nime muutmiseks";
    title.onclick = () => {
      showDialogPopup({
        title: "Muuda harjutuse nime",
        message: "Sisesta uus harjutuse nimi.",
        confirmText: "Salvesta",
        cancelText: "Tühista",
        inputPlaceholder: ex.name || "Unnamed",
        onConfirm: (value) => {
          const nextName = value?.trim();
          if (!nextName) return;

          ex.name = nextName;
          save();
          render();
        },
      });
    };
    card.classList.toggle("completed", isExerciseCompleted(ex));

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
    deleteBtn.className = "deleteBtn";

    // Vasak pool
    left.appendChild(toggleBtn);
    left.appendChild(title);

    // Header
    header.appendChild(left);
    header.appendChild(deleteBtn);

    deleteBtn.onclick = () => {
      const dayEntry = getDayEntry(currentDate);
      dayEntry.exercises.splice(exIndex, 1);

      if (dayEntry.exercises.length === 0 && !dayEntry.workoutName) {
        delete workouts[currentDate];
      } else {
        setDayEntry(currentDate, dayEntry);
      }

      save();
      render();
    };

    const setsDiv = document.createElement("div");
    setsDiv.className = "sets-panel";
    setsDiv.classList.toggle("hidden", !ex.open);
    setsDiv.style.display = ex.open ? "block" : "none";

    ex.sets.forEach((set) => {
      const row = document.createElement("div");
      row.className = "set-row";

      const values = document.createElement("div");
      values.className = "set-values";

      const repsText = document.createElement("span");
      repsText.className = "set-text";

      const weightText = document.createElement("span");
      weightText.className = "set-text set-text--secondary";

      const separator = document.createElement("span");
      separator.className = "set-separator";
      separator.textContent = "×";

      const doubleTapDelay = 280;

      function bindDoubleTap(element, type, currentValue, onSave) {
        let lastTapTime = 0;

        element.addEventListener("touchend", (event) => {
          const now = Date.now();
          const isDoubleTap = now - lastTapTime < doubleTapDelay;

          if (isDoubleTap) {
            event.preventDefault();
            event.stopPropagation();
            showDialogPopup({
              title: type === "reps" ? "Muuda seeriat" : "Muuda raskust",
              message:
                type === "reps"
                  ? "Sisesta uus korduste arv."
                  : "Sisesta uus kaal kilogrammides.",
              confirmText: "Salvesta",
              cancelText: "Tühista",
              inputPlaceholder: String(currentValue),
              onConfirm: (value) => {
                const numericValue = Number(value);
                if (!Number.isFinite(numericValue) || numericValue <= 0) {
                  return;
                }

                onSave(numericValue);
                save();
                render();
              },
            });
          }

          lastTapTime = now;
        });
      }

      function bindDeleteTap(element) {
        let lastTapTime = 0;

        element.addEventListener("touchend", (event) => {
          const now = Date.now();
          const isDoubleTap = now - lastTapTime < doubleTapDelay;

          if (isDoubleTap) {
            event.preventDefault();
            event.stopPropagation();
            showDeleteUI(set, ex, row);
          }

          lastTapTime = now;
        });
      }

      function updateUI() {
        const reps = set.actualReps ?? set.plannedReps;
        repsText.textContent = `${reps}`;
        weightText.textContent = `${set.weight}kg`;
        repsText.classList.toggle("done", set.done === true);
        repsText.classList.toggle("undone", set.done === false);
        weightText.classList.toggle("done", set.done === true);
        weightText.classList.toggle("undone", set.done === false);
      }

      const doneBtn = document.createElement("button");
      doneBtn.innerHTML = '<i data-lucide="check"></i>';
      doneBtn.className = "doneBtn";

      const undoneBtn = document.createElement("button");
      undoneBtn.innerHTML = '<i data-lucide="x"></i>';
      undoneBtn.className = "undoneBtn";

      doneBtn.onclick = () => {
        set.done = true;
        set.actualReps = null;
        save();
        updateUI();

        doneBtn.classList.add("pulse");
        setTimeout(() => {
          doneBtn.classList.remove("pulse");
          render();
          checkWorkoutCompletion();
        }, 140);
      };

      undoneBtn.onclick = () => {
        showDialogPopup({
          title: "Mitu kordust tegelikult tuli?",
          message: "Sisesta tehtud korduste arv.",
          confirmText: "Salvesta",
          cancelText: "Tühista",
          inputPlaceholder: "nt. 10",
          onConfirm: (value) => {
            if (!value) return;

            set.done = false;
            set.actualReps = Number(value);

            save();
            updateUI();
            render();
            checkWorkoutCompletion();
          },
        });
      };

      bindDoubleTap(repsText, "reps", set.plannedReps, (value) => {
        set.plannedReps = value;
      });

      bindDoubleTap(weightText, "weight", set.weight, (value) => {
        set.weight = value;
      });

      bindDeleteTap(values);

      updateUI();

      values.appendChild(repsText);
      values.appendChild(separator);
      values.appendChild(weightText);
      row.appendChild(values);
      row.appendChild(doneBtn);
      row.appendChild(undoneBtn);
      setsDiv.appendChild(row);
    });

    const addSetBtn = document.createElement("button");
    addSetBtn.className = "addSetBtn";
    addSetBtn.textContent = "+ Lisa seeria";

    addSetBtn.onclick = () => {
      ex.sets.push({
        plannedReps: ex.sets[ex.sets.length - 1]?.plannedReps || 10,
        actualReps: null,
        weight: ex.sets[ex.sets.length - 1]?.weight || 0,
        done: null,
      });

      save();
      render();
    };

    setsDiv.appendChild(addSetBtn);
    card.appendChild(header);
    card.appendChild(setsDiv);
    list.appendChild(card);
  });

  lucide.createIcons();
}

function showDeleteUI(set, ex, row) {
  row.classList.add("danger");

  const actions = document.createElement("div");
  actions.className = "set-actions";

  const del = document.createElement("button");
  del.classList.add("deleteSetBtn");
  del.innerHTML = '<i data-lucide="trash-2"></i>';

  const cancel = document.createElement("button");
  cancel.classList.add("cancelDeleteBtn");
  cancel.innerHTML = '<i data-lucide="undo-2"></i>';

  del.onclick = () => {
    ex.sets = ex.sets.filter((s) => s !== set);
    save();
    render();
  };

  cancel.onclick = () => {
    row.classList.remove("danger");
    actions.remove();
  };

  actions.appendChild(del);
  actions.appendChild(cancel);
  row.appendChild(actions);
  lucide.createIcons();
}
