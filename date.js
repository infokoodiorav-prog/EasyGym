const input = document.getElementById("dateInput");
const btn = document.getElementById("dateBtn");
const prev = document.getElementById("prevBtn");
const next = document.getElementById("nextBtn");
const dayName = document.getElementById("dayName");

function updateDateUI() {
  if (!input || !btn || !dayName || !prev || !next) return;

  const date = new Date(currentDate);

  input.value = currentDate;
  btn.textContent = date.toLocaleDateString("en-GB");

  btn.textContent = date.toLocaleDateString("en-GB");

  const weekday = date.toLocaleDateString("et-EE", {
    weekday: "long",
  });

  dayName.textContent = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  if (typeof render === "function") {
    render();
  }
}

if (input) {
  input.addEventListener("change", (e) => {
    currentDate = e.target.value;
    save();
    updateDateUI();
  });
}

if (prev) {
  prev.addEventListener("click", () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    currentDate = formatLocalDate(d);
    save();
    updateDateUI();
  });
}

if (next) {
  next.addEventListener("click", () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    currentDate = formatLocalDate(d);
    save();
    updateDateUI();
  });
}
