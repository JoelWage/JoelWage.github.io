console.log('JS script loaded');

document.addEventListener('DOMContentLoaded', () => {
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
  const maxEC = 60;

  // Load gradesData from localStorage or initialize empty
  let gradesData = JSON.parse(localStorage.getItem('gradesData')) || [];

  function normalize(str) {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function debugCompareStrings(input, tableCell) {
    console.log('Input:', input, 'Char codes:', [...input].map(c => c.charCodeAt(0)));
    console.log('Table:', tableCell, 'Char codes:', [...tableCell].map(c => c.charCodeAt(0)));
  }

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
        cells[3].innerHTML = `<div class="grade-box">${grade}</div>`;
        return true;
      }
    }
    return false;
  }

  // Load gradesData into the table when the page loads
  function loadGradesToTable() {
    gradesData.forEach(({ quarter, course, test, grade }) => {
      updateGradeOnly(quarter, course, test, grade);
    });
  }

  // Save the gradesData array to localStorage
  function saveGrades() {
    localStorage.setItem('gradesData', JSON.stringify(gradesData));
  }

  // Update progress bar and save it locally
  function updateProgressBar(points) {
    points = Math.min(Math.max(points, 0), maxEC);
    const widthPercent = (points / maxEC) * 100;
    progressBar.style.width = widthPercent + '%';
    ecEarnedElement.textContent = points.toFixed(1);
    pointsNeededElement.textContent = `Points needed: ${Math.max(maxEC - points, 0)}`;
    progressPercentElement.textContent = `Completion: ${widthPercent.toFixed(1)}%`;
    localStorage.setItem('progressValue', points);
    input.value = points;
  }

  // Load saved progress value on page load
  const savedPoints = localStorage.getItem('progressValue');
  updateProgressBar(savedPoints !== null ? parseFloat(savedPoints) : 0);

  // Button click to update progress bar value
  button.addEventListener('click', () => {
    let points = Number(input.value);
    updateProgressBar(points);
  });

  // Modal open/close
  openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // Load saved grades in table on page load
  loadGradesToTable();

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

  waitForTableRows(() => {
    gradeForm.addEventListener('submit', event => {
      console.log('Submit event triggered');
      event.preventDefault();
      console.log('Default prevented');

      const quarter = gradeForm.quarter.value.trim();
      const course = gradeForm.course.value.trim();
      const test = gradeForm.test.value.trim();
      const grade = gradeForm.grade.value.trim();
      const credits = Number(gradeForm.ec.value);

      if (!quarter || !course || !test || !grade || isNaN(credits) || credits < 0) {
        alert('Please fill all fields correctly');
        return;
      }

      // Check if grade is already in gradesData, update it; otherwise add new
      const existingIndex = gradesData.findIndex(
        g =>
          normalize(g.quarter) === normalize(quarter) &&
          normalize(g.course) === normalize(course) &&
          normalize(g.test) === normalize(test)
      );

      if (existingIndex !== -1) {
        gradesData[existingIndex].grade = grade;
      } else {
        gradesData.push({ quarter, course, test, grade });
      }

      saveGrades();

      // Update progress bar total credits
      const currentPoints = parseFloat(ecEarnedElement.textContent) || 0;
      let newTotal = currentPoints + credits;
      if (newTotal > maxEC) newTotal = maxEC;
      updateProgressBar(newTotal);

      // Update grade shown in table
      updateGradeOnly(quarter, course, test, grade);

      gradeForm.reset();
      modal.classList.add('hidden');

      console.log('Grade updated, progress updated');
    });
  });
});
