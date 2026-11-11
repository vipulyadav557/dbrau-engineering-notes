document.addEventListener('DOMContentLoaded', () => {

  const searchInput = document.getElementById('pyq-search-input');
  const pyqList = document.getElementById('pyq-list');
  const pyqCount = document.getElementById('pyq-count');

  let allPYQs = [];

  // Create safe text element
  function createElement(tag, className, value) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    element.textContent = value || '';

    return element;
  }

  // Load all PYQs from backend
  async function loadPYQs() {
    try {
      pyqList.innerHTML =
        '<div class="pyq-message">Loading question papers...</div>';

      const response = await fetch('/api/pyqs');

      if (!response.ok) {
        throw new Error('Unable to load question papers');
      }

      const data = await response.json();

      allPYQs = Array.isArray(data)
        ? data
        : data.pyqs || [];

      displayPYQs(allPYQs);

    } catch (error) {
      console.error('PYQ loading error:', error);

      pyqList.innerHTML =
        '<div class="pyq-message">Unable to load papers. Please try again later.</div>';

      pyqCount.textContent = 'Loading failed';
    }
  }

  // Display PYQ cards
  function displayPYQs(pyqs) {

    pyqList.innerHTML = '';

    pyqCount.textContent =
      `${pyqs.length} question paper(s) found`;

    if (pyqs.length === 0) {
      pyqList.innerHTML =
        '<div class="pyq-message">No question papers found. Try another search.</div>';

      return;
    }

    pyqs.forEach((pyq) => {

      const card = createElement('article', 'pyq-card');

      const title = createElement(
        'h3',
        '',
        pyq.title || 'Untitled Question Paper'
      );

      const tags = createElement('div', 'pyq-meta');

      [
        pyq.subject,
        pyq.year,
        pyq.semester,
        pyq.examYear,
        pyq.branch
      ].filter(Boolean).forEach((value) => {

        tags.appendChild(
          createElement('span', 'pyq-tag', value)
        );

      });

      const description = createElement(
        'p',
        'pyq-description',
        pyq.description || 'Previous year question paper.'
      );

      const actions = createElement('div', 'pyq-actions');

      const fileUrl = pyq.fileUrl;

      if (typeof fileUrl === 'string' &&
          fileUrl.startsWith('/uploads/')) {

        const viewLink = document.createElement('a');

        viewLink.href = fileUrl;
        viewLink.target = '_blank';
        viewLink.rel = 'noopener noreferrer';
        viewLink.className = 'pyq-view';
        viewLink.textContent = 'View PDF';

        const downloadLink = document.createElement('a');

        downloadLink.href = fileUrl;
        downloadLink.download = '';
        downloadLink.className = 'pyq-download';
        downloadLink.textContent = 'Download PDF';

        actions.append(viewLink, downloadLink);

      } else {

        actions.appendChild(
          createElement('p', 'pyq-description', 'PDF not available')
        );

      }

      card.append(
        title,
        tags,
        description,
        actions
      );

      pyqList.appendChild(card);

    });
  }

  // Search all years and semesters
  searchInput.addEventListener('input', () => {

    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
      displayPYQs(allPYQs);
      return;
    }

    const filteredPYQs = allPYQs.filter((pyq) => {

      const searchableText = [
        pyq.title,
        pyq.subject,
        pyq.branch,
        pyq.year,
        pyq.semester,
        pyq.examYear,
        pyq.description
      ].join(' ').toLowerCase();

      return searchableText.includes(query);

    });

    displayPYQs(filteredPYQs);

  });

  // Initial loading
  loadPYQs();

});