
document.addEventListener("DOMContentLoaded", async () => {

  // ==========================================
  // 1. LOAD SHARED HEADER AND FOOTER
  // ==========================================

  async function loadComponent(placeholderId, filePath) {
    const placeholder = document.getElementById(placeholderId);

    if (!placeholder) return;

    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}`);
      }

      placeholder.innerHTML = await response.text();

    } catch (error) {
      console.error("Component loading error:", error);
    }
  }

  // Load Header and Footer together
  await Promise.all([
    loadComponent("header-placeholder", "/components/header.html"),
    loadComponent("footer-placeholder", "/components/footer.html")
  ]);


  // ==========================================
  // 2. ACTIVE NAVIGATION LINK
  // ==========================================

  const currentPath = window.location.pathname;

  document.querySelectorAll("[data-nav]").forEach((link) => {

    const linkPath = new URL(link.href).pathname;

    if (linkPath === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }

  });


  // ==========================================
  // 3. MOBILE NAVIGATION
  // ==========================================

  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", () => {

      const isOpen = navLinks.classList.toggle("is-open");

      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    });

  }


  // ==========================================
  // 4. FOOTER CURRENT YEAR
  // ==========================================

  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  // ==========================================
  // 5. STUDENT LOGIN STATUS
  // ==========================================

  const loginLink = document.getElementById("studentLoginLink");

  const studentAccount = document.getElementById("studentAccount");

  const studentHeaderName = document.getElementById("studentHeaderName");

  const studentAvatar = document.getElementById("studentAvatar");

  try {

    const response = await fetch("/api/student-auth/me", {
      credentials: "same-origin"
    });

    if (response.ok) {

      const result = await response.json();

      if (result.student) {

        const student = result.student;

        const name = student.fullName || "Student";

        // Hide Student Login link
        if (loginLink) {
          loginLink.hidden = true;
        }

        // Show Student Account
        if (studentAccount) {
          studentAccount.hidden = false;
        }

        // Display Student Name
        if (studentHeaderName) {
          studentHeaderName.textContent = name;
        }

        // Display First Letter in Avatar
        if (studentAvatar) {
          studentAvatar.textContent = name.charAt(0).toUpperCase();
        }

      }

    }

  } catch (error) {

    console.error("Student session check failed:", error);

  }


  // ==========================================
  // 6. STUDENT PROFILE DROPDOWN
  // ==========================================

  const accountToggle = document.getElementById("studentAccountToggle");

  const accountDropdown = document.getElementById("studentAccountDropdown");

  if (accountToggle && accountDropdown) {

    accountToggle.addEventListener("click", () => {

      const isOpen = accountDropdown.hidden;

      accountDropdown.hidden = !isOpen;

      accountToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    });


    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {

      if (
        !accountToggle.contains(event.target) &&
        !accountDropdown.contains(event.target)
      ) {

        accountDropdown.hidden = true;

        accountToggle.setAttribute(
          "aria-expanded",
          "false"
        );

      }

    });

  }


  // ==========================================
  // 7. STUDENT LOGOUT
  // ==========================================

  const logoutButton = document.getElementById("studentLogout");

  if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

      logoutButton.disabled = true;

      logoutButton.textContent = "Logging out...";

      try {

        const response = await fetch("/api/student-auth/logout", {
          method: "POST",
          credentials: "same-origin"
        });

        if (response.ok) {

          window.location.href = "/pages/login.html";

        } else {

          alert("Logout failed. Please try again.");

          logoutButton.disabled = false;

          logoutButton.textContent = "↪ Logout";

        }

      } catch (error) {

        console.error("Logout error:", error);

        alert("Server connection failed. Please try again.");

        logoutButton.disabled = false;

        logoutButton.textContent = "↪ Logout";

      }

    });

  }

});
