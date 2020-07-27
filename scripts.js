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
		d.close = d.temp;
		latest_temp = d.temp;
		highest_temp = Math.max(latest_temp, highest_temp);
		lowest_temp = Math.min(latest_temp, lowest_temp);
	});
 
	// Scale the range of the data
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain([d3.min(data, function(d) { return d.close; }), d3.max(data, function(d) { return d.close; })]);
 
	// Add the valueline path.
	svg.append("path")	
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
	redness = Math.round(255 * (latest_temp - lowest_temp) / (highest_temp - lowest_temp));
	blueness = 255 - redness;
	greenness = Math.round(0.8 * blueness);
	temp_color = "#" + pad(redness.toString(16),2) + pad(greenness.toString(16),2) + pad(blueness.toString(16),2);
	console.log(temp_color);
	svg.append("text")
        	.attr("x", width / 2 )
        	.attr("y", height / 2)
		.style("text-anchor", "middle")
        	.style("dominant-baseline", "middle")
		.style("font-size", "120px") 
        	.style("font-weight", "bold")
        	.style("fill", temp_color)
		.style("opacity", 0.2)
        	.text(latest_temp.toString() + "°C");
});
