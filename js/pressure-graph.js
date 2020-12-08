function pad(num, size) {
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}
// Set the dimensions of the canvas / graph
var margin = {
		top: 30,
		right: 20,
		bottom: 30,
		left: 50
	},
	width = 600 - margin.left - margin.right,
	height = 270 - margin.top - margin.bottom;

// Parse the date / time
var parseHour = d3.time.format("%H:%M:%S").parse;

// Set the ranges
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
	.orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
	.orient("left").ticks(5);

// Adds the svg canvas
var svg = d3.select("body")
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

x.domain([parseHour("00:00:01"), parseHour("23:59:59")]);

var lowest_hpa = 2000;
var highest_hpa = 0;

d3.csv(document.currentScript.getAttribute('filename'), function(error, data) {
	data.forEach(function(d) {
		d.hour = parseHour(d.time.substring(11, 19));
    		d.hpa = d.pressure / 100;

		highest_hpa = Math.max(d.hpa, highest_hpa);
		lowest_hpa = Math.min(d.hpa, lowest_hpa);
	});
  
	y.domain([lowest_hpa, highest_hpa]);

	var groupedByDay = d3.nest()
		.key(function(d) {
			return d.time.substring(0, 10);
		})
		.entries(data);
	x.domain(d3.extent(data, function(d) {
		return d.hour;
	}));
	
	var today = new Date();
	var today_str = today.getFullYear()+'-'+pad(today.getMonth()+1,2)+'-'+pad(today.getDate(),2);
	for (var i = 0; i < groupedByDay.length; i++) {
		if (today_str === groupedByDay[i]["key"]) {
			opacity = 1;
		} else {
			opacity = 0.02;
		}

		svg.append("path")
			.datum(groupedByDay[i]["values"])
			.attr("fill", "none")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.attr("d", d3.svg.line()
				.x(function(d) {
					return x(d.hour);
				})
				.y(function(d) {
					return y(d.hpa);
				}))
			.style("opacity", opacity);
	}
});

// Add the X Axis
svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

// Add the Y Axis
svg.append("g")
	.attr("class", "y axis")
	.call(yAxis);
svg.append("text")
		.attr("x", 20)
		.attr("y", -10)
		.style("font-size", "12px")
		.style("fill", "black")
		.style("opacity", 1)
		.text("Loftþrýstingur (hPa)");
