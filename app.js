document.addEventListener("DOMContentLoaded", () => {
  updateDateUI();

  const burgerBtn = document.getElementById("burgerBtn");
  const navMenu = document.getElementById("navMenu");

  if (burgerBtn && navMenu) {
    burgerBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const isHidden = navMenu.classList.toggle("hidden");
      burgerBtn.setAttribute("aria-expanded", String(!isHidden));
    });

    document.addEventListener("click", (event) => {
      const clickedInsideMenu = navMenu.contains(event.target);
      const clickedBurger = burgerBtn.contains(event.target);

      if (
        !clickedInsideMenu &&
        !clickedBurger &&
        !navMenu.classList.contains("hidden")
      ) {
        navMenu.classList.add("hidden");
        burgerBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
});
