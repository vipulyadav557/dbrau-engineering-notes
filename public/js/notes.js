
document.addEventListener('DOMContentLoaded', () => {

  // Get HTML elements
  const form = document.getElementById('notesSearchForm');
  const input = document.getElementById('notesSearch');
  const message = document.getElementById('searchMessage');
  const results = document.getElementById('notesResults');
  const clearButton = document.getElementById('clearSearch');

  const branchFilter = document.getElementById('branchFilter');
  const yearFilter = document.getElementById('yearFilter');
  const semesterFilter = document.getElementById('semesterFilter');
  const subjectFilter = document.getElementById('subjectFilter');

  if (
    !form || !input || !message || !results ||
    !branchFilter || !yearFilter ||
    !semesterFilter || !subjectFilter
  ) {
    console.error('Notes page HTML elements are missing.');
    return;
  }

  // Read filters from URL
  const params = new URLSearchParams(window.location.search);

  input.value = params.get('q') || '';
  branchFilter.value = params.get('branch') || '';
  yearFilter.value = params.get('year') || '';
  semesterFilter.value = params.get('semester') || '';

  let allNotes = [];

  // Create safe links for PDF
  function createPdfURL(fileUrl) {
    if (typeof fileUrl !== 'string' || !fileUrl.trim()) {
      return null;
    }

    try {
      const url = new URL(fileUrl.trim(), window.location.origin);

      const isLocal = url.origin === window.location.origin &&
        (url.protocol === 'http:' || url.protocol === 'https:');

      const isExternalHttps = url.protocol === 'https:';

      if (!isLocal && !isExternalHttps) {
        return null;
      }

      return url;
    } catch {
      return null;
    }
  }

  // Update subject dropdown from available notes
  function updateSubjectOptions(notes) {
    const selectedSubject = subjectFilter.value ||
      params.get('subject') || '';

    const subjects = [
      ...new Set(
        notes
          .map(note => String(note.subject || '').trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));

    subjectFilter.replaceChildren();

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All Subjects';
    subjectFilter.appendChild(defaultOption);

    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectFilter.appendChild(option);
    });

    if (subjects.includes(selectedSubject)) {
      subjectFilter.value = selectedSubject;
    } else {
      subjectFilter.value = '';
    }
  }

  // Render notes on the page
  function renderNotes(notes) {
    results.replaceChildren();

    if (notes.length === 0) {
      message.textContent =
        'No notes found. Please change your search or filters.';
      return;
    }

    message.textContent = `${notes.length} note(s) found.`;

    notes.forEach(note => {
      const card = document.createElement('article');
      card.className = 'note-card';

      const title = document.createElement('h3');
      title.textContent = note.title || 'Untitled Note';
      card.appendChild(title);

      // Note details
      const meta = document.createElement('div');
      meta.className = 'note-meta';

      const details = [
        note.subject || 'Subject not specified',
        note.branch || 'Branch not specified',
        note.year ? `Year ${note.year}` : 'Year not specified',
        note.semester ? `Semester ${note.semester}` : 'Semester not specified'
      ];

      details.forEach(detail => {
        const span = document.createElement('span');
        span.textContent = detail;
        meta.appendChild(span);
      });

      card.appendChild(meta);

      // Description
      if (note.description) {
        const description = document.createElement('p');
        description.className = 'note-description';
        description.textContent = note.description;
        card.appendChild(description);
      }

      // PDF links
      const pdfURL = createPdfURL(note.fileUrl);

      if (pdfURL) {
        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const viewLink = document.createElement('a');
        viewLink.href = pdfURL.href;
        viewLink.target = '_blank';
        viewLink.rel = 'noopener noreferrer';
        viewLink.textContent = 'View PDF';

        const downloadLink = document.createElement('a');
        downloadLink.href = pdfURL.href;
        downloadLink.className = 'download-link';
        downloadLink.textContent = 'Download PDF';

        // Download attribute works reliably for same-origin files.
        if (pdfURL.origin === window.location.origin) {
          downloadLink.download = '';
        } else {
          downloadLink.target = '_blank';
          downloadLink.rel = 'noopener noreferrer';
        }

        actions.appendChild(viewLink);
        actions.appendChild(downloadLink);
        card.appendChild(actions);

      } else {
        const noFile = document.createElement('p');
        noFile.className = 'no-file';
        noFile.textContent = 'PDF not available yet.';
        card.appendChild(noFile);
      }

      results.appendChild(card);
    });
  }

  // Load notes from MongoDB API
  async function loadNotes() {
    message.textContent = 'Loading notes...';
    results.replaceChildren();

    try {
      const url = new URL('/api/notes', window.location.origin);

      const query = input.value.trim();
      const branch = branchFilter.value;
      const year = yearFilter.value;
      const semester = semesterFilter.value;
      const subject = subjectFilter.value;

      if (query) url.searchParams.set('q', query);
      if (branch) url.searchParams.set('branch', branch);
      if (year) url.searchParams.set('year', year);
      if (semester) url.searchParams.set('semester', semester);
      if (subject) url.searchParams.set('subject', subject);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      allNotes = Array.isArray(data.notes) ? data.notes : [];

      // Populate subject options from the fetched notes
      updateSubjectOptions(allNotes);

      // Display notes
      renderNotes(allNotes);

    } catch (error) {
      console.error('Notes loading error:', error);

      message.textContent =
        'Unable to load notes. Please check your server and try again.';
    }
  }

  // Apply filters
  form.addEventListener('submit', event => {
    event.preventDefault();

    const url = new URL(window.location.href);

    const filters = {
      q: input.value.trim(),
      branch: branchFilter.value,
      year: yearFilter.value,
      semester: semesterFilter.value,
      subject: subjectFilter.value
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });

    window.history.replaceState({}, '', url);

    loadNotes();
  });

  // Reset all filters
  clearButton.addEventListener('click', () => {
    input.value = '';
    branchFilter.value = '';
    yearFilter.value = '';
    semesterFilter.value = '';
    subjectFilter.value = '';

    window.history.replaceState(
      {},
      '',
      window.location.pathname
    );

    loadNotes();
  });

  // Initial load
  loadNotes();

});
