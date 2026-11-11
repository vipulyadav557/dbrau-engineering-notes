document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("globalSearch");
  const searchInput = document.getElementById("searchInput");

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const query = searchInput.value.trim();

      if (!query) {
        searchInput.focus();
        return;
      }

      const target = "/pages/notes.html?q=" + encodeURIComponent(query);
      window.location.href = target;
    });
  }

  document.querySelectorAll('a[href="#"]').forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });
});
