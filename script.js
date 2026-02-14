document.addEventListener("DOMContentLoaded", () => {
  let originalData = [];
  let lineChartInstance, barChartInstance;

  const fileInput = document.getElementById("fileInput");
  const dataTable = document.getElementById("dataTable");
  const filterColumn = document.getElementById("filterColumn");
  const filterValue = document.getElementById("filterValue");

  // ------------------- File Upload -------------------
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: function(results) {
        originalData = results.data.filter(row => Object.keys(row).length > 0);
        displayTable(originalData);
        populateFilterOptions(originalData);
        renderCharts(originalData);
        gsap.from("section", { opacity: 0, y: 50, duration: 0.8, stagger: 0.2 });
      }
    });
  });

  // ------------------- Table Display -------------------
  function displayTable(data) {
    const thead = dataTable.querySelector("thead");
    const tbody = dataTable.querySelector("tbody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    let headerRow = "<tr>";
    headers.forEach(h => headerRow += `<th onclick="sortTable('${h}')">${h} ⬍</th>`);
    headerRow += "</tr>";
    thead.innerHTML = headerRow;

    data.forEach(row => {
      let bodyRow = "<tr>";
      headers.forEach(h => bodyRow += `<td>${row[h]}</td>`);
      bodyRow += "</tr>";
      tbody.innerHTML += bodyRow;
    });
  }

  // ------------------- Sorting -------------------
  window.sortTable = function(column) {
    const sortedData = [...originalData].sort((a, b) => {
      if (typeof a[column] === "number") return a[column] - b[column];
      return a[column].toString().localeCompare(b[column].toString());
    });
    displayTable(sortedData);
    renderCharts(sortedData);
  }

  // ------------------- Filtering -------------------
  function populateFilterOptions(data) {
    filterColumn.innerHTML = "";
    Object.keys(data[0]).forEach(h => {
      filterColumn.innerHTML += `<option value="${h}">${h}</option>`;
    });
  }

  document.getElementById("applyFilter").addEventListener("click", () => {
    const col = filterColumn.value;
    const val = filterValue.value.trim().toLowerCase();
    const filteredData = originalData.filter(row => {
      return row[col] && row[col].toString().toLowerCase().includes(val);
    });
    displayTable(filteredData);
    renderCharts(filteredData);
  });

  document.getElementById("clearFilter").addEventListener("click", () => {
    filterValue.value = "";
    displayTable(originalData);
    renderCharts(originalData);
  });

  // ------------------- Charts -------------------
  function renderCharts(data) {
    if (data.length === 0) return;
    const numericColumns = Object.keys(data[0]).filter(key => typeof data[0][key] === "number");
    if (numericColumns.length === 0) return;

    const labels = data.map((_, i) => i + 1);
    const dataset = data.map(d => d[numericColumns[0]]);

    // Destroy old charts if exist
    if (lineChartInstance) lineChartInstance.destroy();
    if (barChartInstance) barChartInstance.destroy();

    // Line Chart
    lineChartInstance = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: numericColumns[0],
          data: dataset,
          borderColor: "#0077b6",
          backgroundColor: "rgba(0,119,182,0.2)",
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // Bar Chart
    barChartInstance = new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: numericColumns[0],
          data: dataset,
          backgroundColor: "#023e8a"
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // ------------------- Drag & Drop Charts -------------------
  const draggables = document.querySelectorAll(".draggable");
  draggables.forEach(elem => {
    elem.onmousedown = function(event) {
      let shiftX = event.clientX - elem.getBoundingClientRect().left;
      let shiftY = event.clientY - elem.getBoundingClientRect().top;

      elem.style.position = 'absolute';
      elem.style.zIndex = 1000;
      document.body.append(elem);

      function moveAt(pageX, pageY) {
        elem.style.left = pageX - shiftX + 'px';
        elem.style.top = pageY - shiftY + 'px';
      }

      moveAt(event.pageX, event.pageY);

      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
      }

      document.addEventListener('mousemove', onMouseMove);

      elem.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        elem.onmouseup = null;
      };
    };

    elem.ondragstart = function() { return false; };
  });

  // ------------------- Export Functions -------------------
  window.exportChart = function(chartId) {
    const chart = document.getElementById(chartId);
    const link = document.createElement('a');
    link.download = `${chartId}.png`;
    link.href = chart.toDataURL();
    link.click();
  }

  document.getElementById("exportCSV").addEventListener("click", () => {
    if (originalData.length === 0) return;
    const csv = Papa.unparse(originalData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data_export.csv";
    link.click();
  });
});
