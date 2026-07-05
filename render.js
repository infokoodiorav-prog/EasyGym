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

    if (completed && !ex.userToggled) {
      ex.open = false;
    }

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const left = document.createElement("div");
    left.className = "card-left";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = ex.open ? "▼" : "▶";
    toggleBtn.className = "toggleBtn";

    const title = document.createElement("h3");
    title.textContent = ex.name || "Unnamed";
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
    setsDiv.classList.toggle("hidden", !ex.open);

    toggleBtn.onclick = () => {
      ex.open = !ex.open;
      ex.userToggled = true;

      setsDiv.style.display = ex.open ? "block" : "none";
      toggleBtn.textContent = ex.open ? "▼" : "▶";
      toggleBtn.className = "toggleBtn";

      save();
    };

    ex.sets.forEach((set) => {
      const row = document.createElement("div");
      row.className = "set-row";

      const text = document.createElement("span");

      let lastTapTime = 0;
      const doubleTapDelay = 280;

      row.addEventListener("touchend", (event) => {
        const now = Date.now();
        const isDoubleTap = now - lastTapTime < doubleTapDelay;

        if (isDoubleTap) {
          event.preventDefault();
          showDeleteUI(set, ex, row);
        }

        lastTapTime = now;
      });

      function updateUI() {
        const reps = set.actualReps ?? set.plannedReps;
        text.textContent = `${reps} × ${set.weight}kg`;
        text.classList.toggle("done", set.done === true);
        text.classList.toggle("undone", set.done === false);
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

      updateUI();

      row.appendChild(text);
      row.appendChild(doneBtn);
      row.appendChild(undoneBtn);
      setsDiv.appendChild(row);
    });

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
