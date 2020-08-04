var show_grouped = true;
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
// Set the dimensions of the canvas / graph
var	margin = {top: 30, right: 20, bottom: 30, left: 50},
	width = 600 - margin.left - margin.right,
	height = 270 - margin.top - margin.bottom;
 
// Parse the date / time
var	parseHour = d3.time.format("%H:%M:%S").parse;
var	parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
 
// Set the ranges
var	x = d3.time.scale().range([0, width]);
var	y = d3.scale.linear().range([height, 0]);
 
// Define the axes
var	xAxis = d3.svg.axis().scale(x)
	.orient("bottom").ticks(5);
 
var	yAxis = d3.svg.axis().scale(y)
	.orient("left").ticks(5);

// Define the line
var	valueline = d3.svg.line()
	.x(function(d) { return x(d.date); })
	.y(function(d) { return y(d.close); });
    
// Adds the svg canvas
var	svg = d3.select("body")
	.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
// Get the data
var v_equalizer = 128;
var dates = [];
	
d3.csv(document.currentScript.getAttribute('filename'), function(error, data) {
	data.forEach(function(d) {
		d.date = parseDate(d.time);
		d.hour = parseHour(d.time.substring(11,19));
		dates.push(d.date);
		v_speed = parseInt(d.shutter);
		v_gain = d.gain;
		v_r = parseInt(d.r);
		v_g = parseInt(d.g);
		v_b = parseInt(d.b);
		v_avg = (v_r + v_g + v_b) / 3;
		v_const = v_equalizer / v_avg;
		/*v_r = Math.round(v_const * v_r);
		v_g = Math.round(v_const * v_g);
		v_b = Math.round(v_const * v_b);*/
		v_speed = v_speed * v_gain;
		d.exp = 1000000 / v_speed;
		d.col = "rgb(" + v_r + "," + v_g + "," + v_b + ")";
	});

	var groupedByDay = d3.nest()
				.key(function(d) { return d.time.substring(0, 10); })
				.entries(data);

	// Scale the range of the data
	if (show_grouped) {
		x.domain(d3.extent(data, function(d) { return d.hour; }));
	} else {
		x.domain(d3.extent(data, function(d) { return d.date; }));
	}
	y.domain([d3.min(data, function(d) { return d.exp; }), d3.max(data, function(d) { return d.exp; })]);
 
	/* Add the valueline path.
	var line = svg.append("path")	
		.attr("class", "line")
		.attr("d", valueline(data));*/
 
	// Add the X Axis
	svg.append("g")		
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
 
	// Add the Y Axis
	svg.append("g")		
		.attr("class", "y axis")
		.call(yAxis);
	
	if (show_grouped) {
		console.log("best");
		console.log(groupedByDay);
		for (var i = 0; i < groupedByDay.length; i++) {
				    // Data line and dots group
				//.attr("transform", "translate(" + ((margin.left + margin.right) / 2) + "," + 0 + ")")


			    var lineAndDots = svg.append("g")
					.attr("class", "line-and-dots");

			svg.append("path")
      .datum(groupedByDay[i]["values"])
      .attr("fill", "none")
	.attr("id", groupedByDay[i]["key"])
      .attr("stroke", "black" )
      .attr("stroke-width", 1)
      .attr("d", d3.svg.line()
	.x(function(d) { return x(d.hour); })
	.y(function(d) { return y(d.exp); }))
	.style("opacity", 0.2);
			usefulstring = "#" + groupedByDay[i]["key"];
			    lineAndDots.selectAll("line-circle")
					.data(groupedByDay[i]["values"])
				.enter().append("circle")
				.attr("class", "data-circle")
				.attr("r", 2)
				.attr("cx", function(d) { return x(d.hour); })
				.attr("cy", function(d) { return y(d.exp); })
				.style("fill", function(d) { return d.col; })
				.on("mouseover", function() { d3.select(usefulstring).attr("opacity", 1); })
				.on('mouseout', function() { d3.select(usefulstring).attr("opacity", 0.2); })
				.append("svg:title")
				.text(function(d) { return d.date; });
		}
	} else {
	    // Data line and dots group
    var lineAndDots = svg.append("g")
    		.attr("class", "line-and-dots");
        //.attr("transform", "translate(" + ((margin.left + margin.right) / 2) + "," + 0 + ")")

    // Data line
    lineAndDots.append("path")
        .datum(data)
        .attr("class", "data-line")
        .attr("d", line);

    lineAndDots.selectAll("line-circle")
    		.data(data)
    	.enter().append("circle")
        .attr("class", "data-circle")
        .attr("r", 2)
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.exp); })
	.style("fill", function(d) { return d.col; })
	.append("svg:title")
   	.text(function(d) { return d.col + ", " + d.date; });
	}
});
