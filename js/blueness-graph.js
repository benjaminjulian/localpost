var show_grouped = true;

function blueSkyIndex(h, s, l, shutter, gain, stdh, stds, stdl) {
	var daycolor = 10 * s / shutter;
	var darkness = shutter * gain;
	
	var colclarity = Math.abs(l-50);
	colclarity = (50 - colclarity) * s;

	var h_dist = Math.abs(h-230);
	var h_dist_ind = h_dist > 100 ? 0 : 100 - h_dist;
	h_dist_ind *= s;

	return h_dist_ind * (Math.sqrt(stdh) * s / 100 + stdl / 5 + stds / 1.5 + colclarity / 0.9 + daycolor / 0.2 + h_dist_ind / 10000) / Math.pow(darkness, 1.5);
}

function RGB2HSL(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;
	var max = Math.max(r, g, b);
	var min = Math.min(r, g, b);
	var c = max - min;
	var lum = (max + min) / 2;
	var hue;
	var sat;
	if (c == 0) {
		hue = 0;
		sat = 0;
	} else {
		sat = c / (1 - Math.abs(2 * lum - 1));
		switch (max) {
			case r:
				var segment = (g - b) / c;
				var shift = 0 / 60; // R° / (360° / hex sides)
				if (segment < 0) { // hue > 180, full rotation
					shift = 360 / 60; // R° / (360° / hex sides)
				}
				hue = segment + shift;
				break;
			case g:
				var segment = (b - r) / c;
				var shift = 120 / 60; // G° / (360° / hex sides)
				hue = segment + shift;
				break;
			case b:
				var segment = (r - g) / c;
				var shift = 240 / 60; // B° / (360° / hex sides)
				hue = segment + shift;
				break;
		}
	}
	return [hue * 60, sat * 100, lum * 100]; // hue is in [0,6], scale it up
}

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
var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
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
		d.hour = parseHour(d.time.substring(11, 19));
		v_speed = parseInt(d.shutter);
		v_gain = d.gain;
		v_r = parseInt(d.r);
		v_g = parseInt(d.g);
		v_b = parseInt(d.b);
		hsl = RGB2HSL(v_r, v_g, v_b);
		d.close = blueSkyIndex(hsl[0], hsl[1], hsl[2], v_speed, v_gain, d.coldev, d.satdev, d.contrast)
		latest_temp = d.close;
		highest_temp = Math.max(latest_temp, highest_temp);
		lowest_temp = Math.min(latest_temp, lowest_temp);
	});

	var groupedByDay = d3.nest()
		.key(function(d) {
			return d.time.substring(0, 10);
		})
		.entries(data);
	if (show_grouped) {
		x.domain(d3.extent(data, function(d) {
			return d.hour;
		}));
	} else {
		x.domain(d3.extent(data, function(d) {
			return d.date;
		}));
	}
	
	y.domain([lowest_temp, highest_temp]);
	//y.domain([d3.min(data, function(d) { return d.close; }), d3.max(data, function(d) { return d.close; })]);
	svg.append("linearGradient")
		.attr("id", "line-gradient")
		.attr("gradientUnits", "userSpaceOnUse")
		.attr("x1", 0)
		.attr("y1", y(lowest_temp))
		.attr("x2", 0)
		.attr("y2", y(highest_temp))
		.selectAll("stop")
		.data([{
			offset: "0%",
			color: "#AAAAAA"
		}, {
			offset: "100%",
			color: "#0000FF"
		}])
		.enter().append("stop")
		.attr("offset", function(d) {
			return d.offset;
		})
		.attr("stop-color", function(d) {
			return d.color;
		});
	// Add the valueline path.
	if (show_grouped) {
		var today = new Date();
		var today_str = today.getFullYear()+'-'+pad(today.getMonth()+1,2)+'-'+pad(today.getDate(),2);
		for (var i = 0; i < groupedByDay.length; i++) {
			if (today_str === groupedByDay[i]["key"]) {
				opacity = 1;
			} else {
				opacity = 0.2;
			}
			
			svg.append("path")
				.datum(groupedByDay[i]["values"])
				.attr("fill", "none")
				.attr("stroke", "url(#line-gradient)")
				.attr("stroke-width", 2)
				.attr("d", d3.svg.line()
					.x(function(d) {
						return x(d.hour);
					})
					.y(function(d) {
						return y(d.close);
					}))
				.style("opacity", opacity);
		}
	} else {
		svg.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", "url(#line-gradient)")
			.attr("stroke-width", 2)
			.attr("d", d3.svg.line()
				.x(function(d) {
					return x(d.date);
				})
				.y(function(d) {
					return y(d.close);
				}))
			.style("opacity", 0.5);
	}

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
	temp_color = "#" + pad(redness.toString(16), 2) + pad(greenness.toString(16), 2) + pad(blueness.toString(16), 2);
	svg.append("text")
		.attr("x", width / 2)
		.attr("y", height / 2)
		.attr("class", "outline-text")
		.style("text-anchor", "middle")
		.style("dominant-baseline", "middle")
		.style("font-size", "120px")
		.style("font-weight", "bold")
		.style("fill", temp_color)
		.style("opacity", 0.2)
		.text(latest_temp.toString() + "°C");
});
