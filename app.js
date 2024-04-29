async function loadData() {
  try {
    const cases = await d3.csv("cases.csv");
    const deaths = await d3.csv("deaths.csv");
    const vaccinations = await d3.csv("vaccinations1.csv");
    const statePolygons = await d3.json("us-states.json");

    const width = 800;
    const height = 500;

    const svg = d3
      .select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const projection = d3.geoAlbersUsa().scale(1000).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const colorScales = {
      "cases": d3.scaleLinear().range(["#d3eecd","#b7e2b1","#97d494","#73c378","#4daf62","#2f984f","#157f3b","#036429"]),
      "deaths": d3.scaleLinear().range(["#fdc9b4","#fcaa8e","#fc8a6b","#f9694c","#ef4533","#d92723","#bb151a","#970b13"]),
      "vaccinations": d3.scaleLinear().range(["#cfe1f2","#b5d4e9","#93c3df","#6daed5","#4b97c9","#2f7ebc","#1864aa","#0a4a90"])
    };

    // Create the tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid black")
      .style("padding", "5px")
      .text("Tooltip");

    function updateMap(dataType, date) {
      const data = getDataForDate(dataType, date);
      const maxValue = d3.max(data, (d) => d.value);
      const colorScale = colorScales[dataType].domain([0, maxValue]);

      svg
        .selectAll("path")
        .data(statePolygons.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d) => {
          const state = data.find((s) => s.state === d.properties.name);
          return state ? colorScale(state.value) : "#ccc";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function (event, d) {
          const stateName = d.properties.name;
          const stateData = data.find((s) => s.state === stateName);
          tooltip
            .style("visibility", "visible")
            .html(
              `<strong>${stateName}</strong><br>${dataType}: ${stateData.value}`
            );
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        });
    }

    function getDataForDate(dataType, date) {
      let data;
      switch (dataType) {
        case "cases":
          data = cases.filter((d) => d.date === date);
          break;
        case "deaths":
          data = deaths.filter((d) => d.date === date);
          break;
        case "vaccinations":
          data = vaccinations.filter((d) => d.date === date);
          break;
      }
      return data.map((d) => ({
        state: d.Province_State,
        value: dataType === "vaccinations" ? d.people_fully_vaccinated : d.total_cases || d.total_deaths
      }));
    }

    const dataTypeSelect = d3.select("#data-type");
    const datePicker = d3.select("#date-picker");

    // Set the default date for the calendar
    const defaultDate = new Date(2020, 3, 01).toISOString().split('T')[0]; // January 22, 2020
    datePicker.property("value", defaultDate);

    dataTypeSelect.on("change", function () {
      const dataType = this.value;
      const date = datePicker.property("value");
      updateMap(dataType, date);
    });

    datePicker.on("change", function () {
      const dataType = dataTypeSelect.property("value");
      const date = this.value;
      updateMap(dataType, date);
    });

    // Initialize the map with default data type and date
    updateMap("cases", defaultDate);
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

async function main() {
  await loadData();
}

main();