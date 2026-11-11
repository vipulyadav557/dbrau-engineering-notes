
async function loadStudentDashboard() {
  const recentNotes = document.getElementById("recentNotes");

  try {
    const response = await fetch("/api/student-auth/me", {
      credentials: "same-origin"
    });

    if (!response.ok) {
      window.location.replace("/pages/login.html");
      return;
    }

    const data = await response.json();

   if (!response.ok || !data.student) {
  window.location.replace("/pages/login.html");
  return;
}

    const student = data.student;

    // Welcome message
    const studentName = document.getElementById("studentName");
    if (studentName) {
      studentName.textContent = student.fullName || "Student";
    }

    // Profile details
    const profileName = document.getElementById("profileName");
    const profileRoll = document.getElementById("profileRoll");
    const profileEmail = document.getElementById("profileEmail");
    const profileBranch = document.getElementById("profileBranch");
    const profileYear = document.getElementById("profileYear");

    if (profileName) profileName.textContent = student.fullName || "Not available";
    if (profileRoll) profileRoll.textContent = student.rollNumber || "Not available";
    if (profileEmail) profileEmail.textContent = student.email || "Not available";
    if (profileBranch) profileBranch.textContent = student.branch || "Not available";

    const yearSuffix = {
      "1": "st",
      "2": "nd",
      "3": "rd",
      "4": "th"
    };

    if (profileYear) {
      const year = String(student.year || "");
      profileYear.textContent = year
        ? `${year}${yearSuffix[year] || "th"} Year`
        : "Not available";
    }

    // Show profile only when My Profile is clicked
    const profileSection = document.getElementById("myProfile");

    if (profileSection && window.location.hash === "#myProfile") {
      profileSection.hidden = false;

      setTimeout(() => {
        profileSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
    }

    await loadRecentNotes();

  } catch (error) {
    console.error("Dashboard loading error:", error);
    window.location.replace("/pages/login.html");
  }
}


async function loadRecentNotes() {
  const recentNotes = document.getElementById("recentNotes");

  if (!recentNotes) return;

  try {
    const response = await fetch("/api/notes");

    if (!response.ok) {
      throw new Error("Unable to fetch notes");
    }

    const data = await response.json();

    recentNotes.replaceChildren();

    if (!data.notes || data.notes.length === 0) {
      const message = document.createElement("p");
      message.textContent = "No notes available yet.";
      recentNotes.appendChild(message);
      return;
    }

    data.notes.slice(0, 5).forEach((note) => {
      const article = document.createElement("article");
      article.className = "dashboard-note";

      const title = document.createElement("h3");
      title.textContent = note.title;

      const details = document.createElement("p");
      details.textContent =
        `${note.subject} | ${note.branch} | Year ${note.year} | Semester ${note.semester}`;

      article.append(title, details);

      if (note.fileUrl) {
        const link = document.createElement("a");
        link.href = note.fileUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "View PDF";
        article.appendChild(link);
      } else {
        const unavailable = document.createElement("p");
        unavailable.textContent = "PDF not available yet.";
        article.appendChild(unavailable);
      }

      recentNotes.appendChild(article);
    });

  } catch (error) {
    console.error("Notes loading error:", error);
    recentNotes.textContent = "Unable to load notes right now.";
  }
}


// Start dashboard
document.addEventListener("DOMContentLoaded", loadStudentDashboard);
