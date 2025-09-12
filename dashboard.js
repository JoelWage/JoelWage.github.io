// Log message to confirm the JS script has loaded
console.log('JS script loaded');

// Wait for the DOM content to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  // Get references to various elements by their IDs for interaction
  const gradeForm = document.getElementById('grade-form');
  const progressBar = document.getElementById('progress-earned');
  const input = document.getElementById('progress-input');
  const button = document.getElementById('update-btn');
  const openBtn = document.getElementById('open-modal-btn');
  const modal = document.getElementById('form-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const ecEarnedElement = document.getElementById('ec-earned');
  const pointsNeededElement = document.getElementById('points-needed');
  const progressPercentElement = document.getElementById('progress-percent');
  const tableBody = document.querySelector('#grades-table tbody');
  const maxEC = 60;  // Maximum EC points for the progress bar

  // Load saved grades data from localStorage or start with an empty array
  let gradesData = JSON.parse(localStorage.getItem('gradesData')) || [];

  // Normalize strings by trimming, converting to lowercase, and replacing extra whitespace with a single space
  function normalize(str) {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // Debug helper: compare input and table cell strings by showing character codes (for troubleshooting)
  function debugCompareStrings(input, tableCell) {
    console.log('Input:', input, 'Char codes:', [...input].map(c => c.charCodeAt(0)));
    console.log('Table:', tableCell, 'Char codes:', [...tableCell].map(c => c.charCodeAt(0)));
  }

  // Update the displayed grade in the table matching quarter, course, and test
  function updateGradeOnly(quarter, course, test, grade) {
    const rows = document.querySelectorAll('#grades-table tbody tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      const quarterCell = cells[0].textContent.trim();
      const courseCell = cells[1].textContent.trim();
      const testCell = cells[2].textContent.trim();

      debugCompareStrings(quarter, quarterCell);
      debugCompareStrings(course, courseCell);
      debugCompareStrings(test, testCell);

      if (
        normalize(quarterCell) === normalize(quarter) &&
        normalize(courseCell) === normalize(course) &&
        normalize(testCell) === normalize(test)
      ) {
        // Insert the grade inside a styled div box in the grade cell
        cells[3].innerHTML = `<div class="grade-box">${grade}</div>`;
        return true;  // Grade updated
      }
    }
    return false; // Grade not found in table
  }

  // Load saved grades into the table when the page loads
  function loadGradesToTable() {
    gradesData.forEach(({ quarter, course, test, grade }) => {
      updateGradeOnly(quarter, course, test, grade);
    });
  }

  // Save the gradesData array to localStorage as a JSON string
  function saveGrades() {
    localStorage.setItem('gradesData', JSON.stringify(gradesData));
  }

  // Update the progress bar's width and text based on earned points
  function updateProgressBar(points) {
    // Clamp points between 0 and maxEC
    points = Math.min(Math.max(points, 0), maxEC);
    const widthPercent = (points / maxEC) * 100;
    progressBar.style.width = widthPercent + '%';
    ecEarnedElement.textContent = points.toFixed(1);
    pointsNeededElement.textContent = `Points needed: ${Math.max(maxEC - points, 0)}`;
    progressPercentElement.textContent = `Completion: ${widthPercent.toFixed(1)}%`;
    localStorage.setItem('progressValue', points);  // Save progress to localStorage
    input.value = points;  // Update input field value
  }

  // Load saved progress value when the page loads and update progress bar accordingly
  const savedPoints = localStorage.getItem('progressValue');
  updateProgressBar(savedPoints !== null ? parseFloat(savedPoints) : 0);

  // Update progress bar when the update button is clicked
  button.addEventListener('click', () => {
    let points = Number(input.value);
    updateProgressBar(points);
  });

  // Open modal window when the open button is clicked
  openBtn.addEventListener('click', () => modal.classList.remove('hidden'));

  // Close modal when the close button is clicked
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Close modal if user clicks outside the modal content
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // Load saved grades into the table immediately on page load
  loadGradesToTable();

  // Wait until the grade table rows have been rendered before adding form submission handler
  function waitForTableRows(callback) {
    const interval = setInterval(() => {
      const rows = document.querySelectorAll('#grades-table tbody tr');
      if (rows.length > 0) {
        clearInterval(interval);
        console.log('Table rows detected:', rows.length);
        callback();
      }
    }, 100);
  }

  // Setup form submission event listener once table rows exist
  waitForTableRows(() => {
    gradeForm.addEventListener('submit', event => {
      console.log('Submit event triggered');
      event.preventDefault();  // Prevent form from submitting normally
      console.log('Default prevented');

      // Get form input values and trim whitespace
      const quarter = gradeForm.quarter.value.trim();
      const course = gradeForm.course.value.trim();
      const test = gradeForm.test.value.trim();
      const grade = gradeForm.grade.value.trim();
      const credits = Number(gradeForm.ec.value);

      // Basic validation to check all fields are filled correctly
      if (!quarter || !course || !test || !grade || isNaN(credits) || credits < 0) {
        alert('Please fill all fields correctly');
        return;
      }

      // Find if this grade entry already exists in gradesData array (match by quarter, course, test)
      const existingIndex = gradesData.findIndex(
        g =>
          normalize(g.quarter) === normalize(quarter) &&
          normalize(g.course) === normalize(course) &&
          normalize(g.test) === normalize(test)
      );

      // If existing, update the grade, else add a new entry
      if (existingIndex !== -1) {
        gradesData[existingIndex].grade = grade;
      } else {
        gradesData.push({ quarter, course, test, grade });
      }

      // Save updated gradesData array
      saveGrades();

      // Update overall progress points for ECs earned
      const currentPoints = parseFloat(ecEarnedElement.textContent) || 0;
      let newTotal = currentPoints + credits;
      if (newTotal > maxEC) newTotal = maxEC;
      updateProgressBar(newTotal);

      // Update grade shown in the table UI
      updateGradeOnly(quarter, course, test, grade);

      // Reset the form and close modal window
      gradeForm.reset();
      modal.classList.add('hidden');

      console.log('Grade updated, progress updated');
    });
  });
});
