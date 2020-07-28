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
var latest_temp = 0;
var highest_temp = 0;
var redness = 0;
var blueness = 0;
var greenness = 0;
var lowest_temp = 100;
var temp_color = "";
	
d3.csv(document.currentScript.getAttribute('filename'), function(error, data) {
	data.forEach(function(d) {
		d.date = parseDate(d.time);
		d.exp = 1000000 / d.shutter;
		d.col = "#" + d.r.toString(16) + d.g.toString(16) + d.b.toString(16);
		console.log(d.r);
	});
 
	// Scale the range of the data
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain([d3.min(data, function(d) { return d.exp; }), d3.max(data, function(d) { return d.exp; })]);
 
	// Add the valueline path.
	var line = svg.append("path")	
		.attr("class", "line")
		.attr("d", valueline(data));
 
	// Add the X Axis
	svg.append("g")		
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
 
	// Add the Y Axis
	svg.append("g")		
		.attr("class", "y axis")
		.call(yAxis);
	
	    // Data line and dots group
    var lineAndDots = svg.append("g")
    		.attr("class", "line-and-dots")
        .attr("transform", "translate(" + ((margin.left + margin.right) / 2) + "," + 0 + ")")

    // Data line
    lineAndDots.append("path")
        .datum(data)
        .attr("class", "data-line")
        .attr("d", line);

    // Data dots
    lineAndDots.selectAll("line-circle")
    		.data(data)
    	.enter().append("circle")
        .attr("class", "data-circle")
        .attr("r", 5)
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.exp); })
	.attr("fill", d.col);
});
