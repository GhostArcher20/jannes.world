fetch('sidebar.html')
  .then(response => response.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find all containers that should be filled dynamically
    document.querySelectorAll('.sidebar').forEach(container => {
      const sectionName = container.getAttribute('data-section');
      if (!sectionName) return;

      // Build the ID that matches the section (e.g., 'socials-sidebar')
      const sourceId = `${sectionName}`;
      const sourceElement = doc.getElementById(sourceId);
      
      if (sourceElement) {
        container.innerHTML = sourceElement.innerHTML;
      }
    });
  });