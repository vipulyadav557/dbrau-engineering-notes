
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Check Admin Login
  try {
    const authResponse = await fetch('/api/auth/me', {
      credentials: 'same-origin'
    });

    if (!authResponse.ok) {
      window.location.replace('/pages/admin-login.html');
      return;
    }

    const authData = await authResponse.json();

    if (authData.isAdmin !== true) {
      window.location.replace('/pages/admin-login.html');
      return;
    }

  } catch (error) {
    console.error('Authentication error:', error);
    window.location.replace('/pages/admin-login.html');
    return;
  }

  // 2. Get HTML Elements
  const form = document.getElementById('adminNoteForm');
  const message = document.getElementById('adminMessage');
  const submitButton = document.getElementById('submitButton');
  const logoutButton = document.getElementById('adminLogoutButton');
  const pdfInput = document.getElementById('pdfFile');

  const notesList = document.getElementById('adminNotesList');
  const manageMessage = document.getElementById('manageNotesMessage');

  if (!form || !message || !submitButton || !notesList) {
    console.error('Required admin elements were not found.');
    return;
  }

  // Common API error handler
  async function getResponseData(response) {
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      window.location.replace('/pages/admin-login.html');
      throw new Error('Admin login required.');
    }

    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong.');
    }

    return result;
  }

  // 3. Logout
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = 'Logging out...';

      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin'
        });

        await getResponseData(response);
        window.location.replace('/pages/admin-login.html');

      } catch (error) {
        console.error('Logout error:', error);

        logoutButton.disabled = false;
        logoutButton.textContent = 'Logout';

        message.textContent = error.message;
        message.style.color = 'red';
      }
    });
  }

  // 4. PDF Validation
  function isValidPdf(file) {
    return (
      file &&
      file.name.toLowerCase().endsWith('.pdf') &&
      file.type === 'application/pdf' &&
      file.size <= 10 * 1024 * 1024
    );
  }

  if (pdfInput) {
    pdfInput.addEventListener('change', () => {
      const file = pdfInput.files[0];

      if (!file) return;

      if (!isValidPdf(file)) {
        pdfInput.value = '';
        message.textContent =
          'Please select a valid PDF file under 10 MB.';
        message.style.color = 'red';
        return;
      }

      message.textContent =
        `Selected PDF: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;

      message.style.color = 'green';
    });
  }

  // 5. Store All Notes
  let allNotes = [];

  // 6. Update Dashboard Statistics
  function updateDashboardStats(notes) {
    const totalNotes = document.getElementById('totalNotes');
    const totalSubjects = document.getElementById('totalSubjects');
    const totalBranches = document.getElementById('totalBranches');

    if (totalNotes) {
      totalNotes.textContent = notes.length;
    }

    if (totalSubjects) {
      totalSubjects.textContent = new Set(
        notes.map(note => note.subject?.trim()).filter(Boolean)
      ).size;
    }

    if (totalBranches) {
      totalBranches.textContent = new Set(
        notes.map(note => note.branch?.trim()).filter(Boolean)
      ).size;
    }
  }

  // 7. Render Notes
  function renderNotes(notes) {
    notesList.replaceChildren();

    if (notes.length === 0) {
      notesList.textContent = allNotes.length === 0
        ? 'No notes found in the database.'
        : 'No notes match your search or filters.';

      return;
    }

    notes.forEach(note => {
      const card = document.createElement('article');
      card.className = 'admin-note-item';

      const heading = document.createElement('h3');
      heading.textContent = note.title || 'Untitled Note';

      const details = document.createElement('p');
      details.textContent =
        `Subject: ${note.subject || '-'} | Branch: ${note.branch || '-'} | Year: ${note.year || '-'} | Semester: ${note.semester || '-'}`;

      const description = document.createElement('p');
      description.textContent =
        `Description: ${note.description || 'No description'}`;

      card.append(heading, details, description);

      // PDF Link
      if (note.fileUrl) {
        const pdfLink = document.createElement('a');
        pdfLink.textContent = 'Open PDF';

        try {
          const parsed = new URL(note.fileUrl, window.location.origin);

          if (
            parsed.protocol === 'https:' ||
            parsed.protocol === 'http:'
          ) {
            pdfLink.href = parsed.href;
            pdfLink.target = '_blank';
            pdfLink.rel = 'noopener noreferrer';
            card.appendChild(pdfLink);
          }

        } catch (error) {
          console.warn('Invalid PDF URL:', error);
        }
      }

      // Action Buttons
      const actions = document.createElement('div');
      actions.className = 'admin-note-actions';

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'admin-edit-button';
      editButton.textContent = 'Edit';
      editButton.dataset.action = 'edit';
      editButton.dataset.id = note._id;

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'admin-delete-button';
      deleteButton.textContent = 'Delete';
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.id = note._id;

      actions.append(editButton, deleteButton);
      card.appendChild(actions);

      notesList.appendChild(card);
    });
  }

  // 8. Search and Filter Notes
  function applyFilters() {
    const searchInput = document.getElementById('searchNotes');
    const branchFilter = document.getElementById('filterBranch');
    const yearFilter = document.getElementById('filterYear');
    const semesterFilter = document.getElementById('filterSemester');

    const searchText =
      searchInput?.value.trim().toLowerCase() || '';

    const selectedBranch = branchFilter?.value || '';
    const selectedYear = yearFilter?.value || '';
    const selectedSemester = semesterFilter?.value || '';

    const filteredNotes = allNotes.filter(note => {
      const title = (note.title || '').toLowerCase();
      const subject = (note.subject || '').toLowerCase();

      const matchesSearch =
        title.includes(searchText) ||
        subject.includes(searchText);

      const matchesBranch =
        !selectedBranch || note.branch === selectedBranch;

      const matchesYear =
        !selectedYear || String(note.year) === selectedYear;

      const matchesSemester =
        !selectedSemester || String(note.semester) === selectedSemester;

      return (
        matchesSearch &&
        matchesBranch &&
        matchesYear &&
        matchesSemester
      );
    });

    renderNotes(filteredNotes);
  }

  // 9. Load Existing Notes
  async function loadNotes() {
    notesList.textContent = 'Loading notes...';

    if (manageMessage) {
      manageMessage.textContent = '';
    }

    try {
      const response = await fetch('/api/notes', {
        credentials: 'same-origin'
      });

      const result = await getResponseData(response);

      allNotes = Array.isArray(result.notes)
        ? result.notes
        : [];

      updateDashboardStats(allNotes);
      applyFilters();

    } catch (error) {
      console.error('Load notes error:', error);
      notesList.textContent =
        error.message || 'Unable to load notes.';
    }
  }

  // 10. Add New Note
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const selectedFile = pdfInput?.files?.[0];

    if (selectedFile && !isValidPdf(selectedFile)) {
      message.textContent =
        'Please select a valid PDF file under 10 MB.';
      message.style.color = 'red';
      return;
    }

    message.textContent = 'Saving note and uploading PDF...';
    message.style.color = '';
    submitButton.disabled = true;

    const formData = new FormData(form);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });

      const result = await getResponseData(response);

      message.textContent =
        result.message || 'Note saved successfully.';
      message.style.color = 'green';

      form.reset();

      await loadNotes();

    } catch (error) {
      console.error('Save note error:', error);

      message.textContent = error.message;
      message.style.color = 'red';

    } finally {
      submitButton.disabled = false;
    }
  });

  // 11. Edit Existing Note
  async function editNote(id, button) {
    const response = await fetch('/api/notes', {
      credentials: 'same-origin'
    });

    const result = await getResponseData(response);

    const note = result.notes.find(item => item._id === id);

    if (!note) {
      throw new Error('Note not found.');
    }

    const title = prompt(
      'Enter Note Title:', note.title || ''
    );
    if (title === null) return;

    const subject = prompt(
      'Enter Subject:', note.subject || ''
    );
    if (subject === null) return;

    const branch = prompt(
      'Enter Branch (CSE, IT, ECE, EE, ME, CE, Other):',
      note.branch || ''
    );
    if (branch === null) return;

    const year = prompt(
      'Enter Year (1, 2, 3, 4):', note.year || ''
    );
    if (year === null) return;

    const semester = prompt(
      'Enter Semester (1 to 8):', note.semester || ''
    );
    if (semester === null) return;

    const description = prompt(
      'Enter Description:', note.description || ''
    );
    if (description === null) return;

    const fileUrl = prompt(
      'Enter PDF URL. Keep the existing value to retain the current PDF:',
      note.fileUrl || ''
    );
    if (fileUrl === null) return;

    if (
      !title.trim() ||
      !subject.trim() ||
      !branch.trim() ||
      !year.trim() ||
      !semester.trim()
    ) {
      alert(
        'Title, subject, branch, year and semester are required.'
      );
      return;
    }

    const formData = new FormData();

    formData.append('title', title.trim());
    formData.append('subject', subject.trim());
    formData.append('branch', branch.trim());
    formData.append('year', year.trim());
    formData.append('semester', semester.trim());
    formData.append('description', description.trim());
    formData.append('fileUrl', fileUrl.trim());

    button.disabled = true;

    try {
      const updateResponse = await fetch(
        `/api/notes/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          credentials: 'same-origin',
          body: formData
        }
      );

      const updateResult =
        await getResponseData(updateResponse);

      if (manageMessage) {
        manageMessage.textContent =
          updateResult.message || 'Note updated successfully.';
        manageMessage.style.color = 'green';
      }

      await loadNotes();

    } finally {
      button.disabled = false;
    }
  }

  // 12. Delete Existing Note
  async function deleteNote(id, button) {
    const confirmed = confirm(
      'Are you sure you want to delete this note? This action cannot be undone.'
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = 'Deleting...';

    try {
      const response = await fetch(
        `/api/notes/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          credentials: 'same-origin'
        }
      );

      const result = await getResponseData(response);

      if (manageMessage) {
        manageMessage.textContent =
          result.message || 'Note deleted successfully.';
        manageMessage.style.color = 'green';
      }

      await loadNotes();

    } catch (error) {
      console.error('Delete note error:', error);

      if (manageMessage) {
        manageMessage.textContent = error.message;
        manageMessage.style.color = 'red';
      }

      button.disabled = false;
      button.textContent = 'Delete';
    }
  }

  // 13. Handle Edit and Delete Button Clicks
  notesList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (!id) return;

    try {
      if (action === 'edit') {
        await editNote(id, button);
      }

      if (action === 'delete') {
        await deleteNote(id, button);
      }

    } catch (error) {
      console.error('Note action error:', error);

      if (manageMessage) {
        manageMessage.textContent = error.message;
        manageMessage.style.color = 'red';
      }
    }
  });

  // 14. Search and Filter Event Listeners
  const searchNotes = document.getElementById('searchNotes');
  const filterBranch = document.getElementById('filterBranch');
  const filterYear = document.getElementById('filterYear');
  const filterSemester = document.getElementById('filterSemester');
  const resetFilters = document.getElementById('resetFilters');

  if (searchNotes) {
    searchNotes.addEventListener('input', applyFilters);
  }

  if (filterBranch) {
    filterBranch.addEventListener('change', applyFilters);
  }

  if (filterYear) {
    filterYear.addEventListener('change', applyFilters);
  }

  if (filterSemester) {
    filterSemester.addEventListener('change', applyFilters);
  }

  if (resetFilters) {
    resetFilters.addEventListener('click', () => {
      if (searchNotes) searchNotes.value = '';
      if (filterBranch) filterBranch.value = '';
      if (filterYear) filterYear.value = '';
      if (filterSemester) filterSemester.value = '';

      applyFilters();
    });
  }

 
  // 10. PYQ Management

  const pyqForm = document.getElementById('adminPYQForm');
  const pyqMessage = document.getElementById('pyqAdminMessage');
  const pyqSubmitButton = document.getElementById('pyqSubmitButton');
  const pyqPdfInput = document.getElementById('pyqPdf');
  const pyqsList = document.getElementById('adminPYQsList');
  const managePYQMessage = document.getElementById('managePYQMessage');

  function isValidPYQPdf(file) {
    return (
      file &&
      file.name.toLowerCase().endsWith('.pdf') &&
      file.type === 'application/pdf' &&
      file.size <= 10 * 1024 * 1024
    );
  }

  // Load all PYQs
  async function loadPYQs() {
    if (!pyqsList) return;

    pyqsList.textContent = 'Loading question papers...';

    if (managePYQMessage) {
      managePYQMessage.textContent = '';
    }

    try {
      const response = await fetch('/api/pyqs', {
        credentials: 'same-origin'
      });

      const result = await getResponseData(response);
      const pyqs = Array.isArray(result)
        ? result
        : Array.isArray(result.pyqs) ? result.pyqs : [];

      pyqsList.replaceChildren();

      if (pyqs.length === 0) {
        pyqsList.textContent = 'No PYQ papers found in the database.';
        return;
      }

      pyqs.forEach((pyq) => {
        const card = document.createElement('article');
        card.className = 'admin-note-item';

        const heading = document.createElement('h3');
        heading.textContent = pyq.title || 'Untitled PYQ';

        const details = document.createElement('p');
        details.textContent =
          `Subject: ${pyq.subject || '-'} | Branch: ${pyq.branch || '-'} | Year: ${pyq.year || '-'} | Semester: ${pyq.semester || '-'} | Exam Year: ${pyq.examYear || '-'}`;

        const description = document.createElement('p');
        description.textContent =
          `Description: ${pyq.description || 'No description'}`;

        card.append(heading, details, description);

        if (
          typeof pyq.fileUrl === 'string' &&
          pyq.fileUrl.startsWith('/uploads/')
        ) {
          const pdfLink = document.createElement('a');
          pdfLink.href = pyq.fileUrl;
          pdfLink.target = '_blank';
          pdfLink.rel = 'noopener noreferrer';
          pdfLink.textContent = 'Open PYQ PDF';
          card.appendChild(pdfLink);
        }

        const actions = document.createElement('div');
        actions.className = 'admin-note-actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'admin-edit-button';
        editButton.textContent = 'Edit';
        editButton.dataset.action = 'edit-pyq';
        editButton.dataset.id = pyq._id;

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'admin-delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.dataset.action = 'delete-pyq';
        deleteButton.dataset.id = pyq._id;

        actions.append(editButton, deleteButton);
        card.appendChild(actions);
        pyqsList.appendChild(card);
      });

    } catch (error) {
      console.error('Load PYQs error:', error);
      pyqsList.textContent = error.message || 'Unable to load PYQs.';
    }
  }

  // Upload a new PYQ
  if (pyqForm) {
    pyqForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!pyqForm.reportValidity()) return;

      const selectedFile = pyqPdfInput?.files?.[0];

      if (!isValidPYQPdf(selectedFile)) {
        pyqMessage.textContent =
          'Please select a valid PDF file under 10 MB.';
        pyqMessage.style.color = 'red';
        return;
      }

      pyqMessage.textContent = 'Uploading question paper...';
      pyqMessage.style.color = '';
      pyqSubmitButton.disabled = true;

      try {
        const formData = new FormData(pyqForm);

        const response = await fetch('/api/pyqs', {
          method: 'POST',
          credentials: 'same-origin',
          body: formData
        });

        const result = await getResponseData(response);

        pyqMessage.textContent =
          result.message || 'PYQ added successfully.';
        pyqMessage.style.color = 'green';

        pyqForm.reset();

        await loadPYQs();

      } catch (error) {
        console.error('Save PYQ error:', error);
        pyqMessage.textContent = error.message;
        pyqMessage.style.color = 'red';

      } finally {
        pyqSubmitButton.disabled = false;
      }
    });
  }

  // Edit a PYQ
  async function editPYQ(id, button) {
    const response = await fetch('/api/pyqs', {
      credentials: 'same-origin'
    });

    const result = await getResponseData(response);

    const pyqs = Array.isArray(result.pyqs) ? result.pyqs : [];
    const pyq = pyqs.find(item => item._id === id);

    if (!pyq) {
      throw new Error('PYQ not found.');
    }

    const title = prompt('Enter Paper Title:', pyq.title || '');
    if (title === null) return;

    const subject = prompt('Enter Subject:', pyq.subject || '');
    if (subject === null) return;

    const branch = prompt('Enter Branch:', pyq.branch || '');
    if (branch === null) return;

    const year = prompt('Enter B.Tech Year (1 to 4):', pyq.year || '');
    if (year === null) return;

    const semester = prompt('Enter Semester (1 to 8):', pyq.semester || '');
    if (semester === null) return;

    const examYear = prompt('Enter Exam Year:', pyq.examYear || '');
    if (examYear === null) return;

    const description = prompt('Enter Description:', pyq.description || '');
    if (description === null) return;

    if (
      !title.trim() ||
      !subject.trim() ||
      !year.trim() ||
      !semester.trim()
    ) {
      throw new Error('Title, subject, year and semester are required.');
    }

    const formData = new FormData();

    formData.append('title', title.trim());
    formData.append('subject', subject.trim());
    formData.append('branch', branch.trim());
    formData.append('year', year.trim());
    formData.append('semester', semester.trim());
    formData.append('examYear', examYear.trim());
    formData.append('description', description.trim());

    button.disabled = true;

    try {
      const updateResponse = await fetch(
        `/api/pyqs/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          credentials: 'same-origin',
          body: formData
        }
      );

      const updateResult = await getResponseData(updateResponse);

      managePYQMessage.textContent =
        updateResult.message || 'PYQ updated successfully.';
      managePYQMessage.style.color = 'green';

      await loadPYQs();

    } finally {
      button.disabled = false;
    }
  }

  // Delete a PYQ
  async function deletePYQ(id, button) {
    const confirmed = confirm(
      'Are you sure you want to delete this question paper?'
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = 'Deleting...';

    try {
      const response = await fetch(
        `/api/pyqs/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          credentials: 'same-origin'
        }
      );

      const result = await getResponseData(response);

      managePYQMessage.textContent =
        result.message || 'PYQ deleted successfully.';
      managePYQMessage.style.color = 'green';

      await loadPYQs();

    } catch (error) {
      managePYQMessage.textContent = error.message;
      managePYQMessage.style.color = 'red';

      button.disabled = false;
      button.textContent = 'Delete';
    }
  }

  // Handle PYQ Edit and Delete buttons
  if (pyqsList) {
    pyqsList.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');

      if (!button) return;

      const id = button.dataset.id;
      const action = button.dataset.action;

      if (!id) return;

      try {
        if (action === 'edit-pyq') {
          await editPYQ(id, button);
        }

        if (action === 'delete-pyq') {
          await deletePYQ(id, button);
        }

      } catch (error) {
        console.error('PYQ action error:', error);

        managePYQMessage.textContent = error.message;
        managePYQMessage.style.color = 'red';
      }
    });
  }

  // Load Notes and PYQs when Admin Panel opens
  await loadNotes();
  await loadPYQs();

});

