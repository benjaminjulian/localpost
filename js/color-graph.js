var show_grouped = true;

function blueSkyIndex(h, s, l, shutter, gain, stdh, stds, stdl) {
	var daycolor = 10 * s / shutter;
	var darkness = shutter * gain;
	var colclarity = (l == 0) ? 0 : 10 * s / l;

	var h_dist = Math.abs(h-230);
	var h_dist_ind = h_dist > 100 ? 0 : 100 - h_dist;

	return (Math.sqrt(stdh) / 3 + stdl / 5 + stds / 1.5 + colclarity / 0.9 + daycolor / 0.2 + h_dist_ind / 100) * 100 / 6 / darkness;
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

function prettyDate(d) {
	if (typeof(d) === "string") {
		dt = new Date(d);
	} else {
		dt = d;
	}
	
	var prefix = "";
	
	if (isToday(d)) {
		prefix = "í dag";
	} else {
		var diff = getTimeDiff(dt, new Date());
		
		if (diff["suffix"] == "dag" || diff["suffix"] == "klst") {
			switch (daysAgo(d)) {
				case 1: prefix = "í gær"; break;
				case 2: prefix = "í fyrradag"; break;
				default: prefix = "fyrir " + daysAgo(d) + " dögum";
			}
		} else {
			prefix = "fyrir " + diff["value"] + " " + diff["suffix"];
		}
	}
	
	return prefix + "  kl. " + dt.getHours() + ":" + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
}

function isToday(d) {
	if (typeof(d) === "string") {
		dt = new Date(d);
	} else {
		dt = d;
	}
	
	cd = new Date();
	
	if (cd.getDate() === dt.getDate() && cd.getMonth() === dt.getMonth() && cd.getYear() === dt.getYear()) {
		return true;
	} else {
		return false;
	}
}

function daysAgo(d) {
	if (typeof(d) === "string") {
		dt = new Date(d);
	} else {
		dt = d;
	}
	
	cd = new Date();
	cd.setHours(23, 59, 59, 999);
	
	time2 = cd.getTime();
	time1 = dt.getTime();
	return Math.trunc(Math.abs((time2 - time1) / (24 * 60 * 60 * 1000)));
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
var parseHour = d3.time.format("%H:%M:%S").parse;
var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
var parseCaption = d3.time.format("%d. %b");

// Set the ranges
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
	.orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
	.orient("left").ticks(5);

// Define the line
var valueline = d3.svg.line()
	.x(function(d) {
		return x(d.date);
	})
	.y(function(d) {
		return y(d.close);
	});

// Adds the svg canvas
var svg = d3.select("body")
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
		d.hour = parseHour(d.time.substring(11, 19));
		d.key = d.time.substring(0, 10);
		d.daytag = d.time.substring(5, 10);
		dates.push(d.date);
		v_speed = parseInt(d.shutter);
		v_gain = d.gain;
		v_r = parseInt(d.r);
		v_g = parseInt(d.g);
		v_b = parseInt(d.b);
		hsl = RGB2HSL(v_r, v_g, v_b);
		d.exp = blueSkyIndex(hsl[0], hsl[1], hsl[2], v_speed, v_gain, d.coldev, d.satdev, d.contrast)
		d.col = "rgb(" + v_r + "," + v_g + "," + v_b + ")";
		d.rad = Math.log(v_speed)/10;
	});

	var groupedByDay = d3.nest()
		.key(function(d) {
			return d.time.substring(0, 10);
		})
		.entries(data);

	// Scale the range of the data
	if (show_grouped) {
		x.domain(d3.extent(data, function(d) {
			return d.hour;
		}));
	} else {
		x.domain(d3.extent(data, function(d) {
			return d.date;
		}));
	}
	y.domain([d3.min(data, function(d) {
		return d.exp;
	}), d3.max(data, function(d) {
		return d.exp;
	})]);

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
	svg.append("text")
		.attr("x", width / 2)
		.attr("y", height / 2)
		.attr("id", "day-name")
		.attr("class", "outline-text")
		.style("text-anchor", "middle")
		.style("dominant-baseline", "middle")
		.style("font-size", "120px")
		.style("font-weight", "bold")
		.style("fill", "black")
		.style("opacity", 0.2)
		.text("");

	if (show_grouped) {
		var today = new Date();
		var today_str = today.getFullYear()+'-'+pad(today.getMonth()+1,2)+'-'+pad(today.getDate(),2);
		for (var i = 0; i < groupedByDay.length; i++) {
			if (today_str === groupedByDay[i]["key"]) {
				class_prefix = "todayline";
				opacity = 1;
			} else {
				class_prefix = "line";
				opacity = 0.2;
			}

			var newpath = svg.append("path")
				.datum(groupedByDay[i]["values"])
				.attr("fill", "none")
				.attr("class", class_prefix + groupedByDay[i]["key"])
				.attr("stroke", "gray")
				.attr("stroke-width", 1)
				.attr("d", d3.svg.line()
					.x(function(d) {
						return x(d.hour);
					})
					.y(function(d) {
						return y(d.exp);
					}))
				.style("opacity", opacity);

			var lineAndDots = svg.append("g")
				.attr("class", "line-and-dots");

			lineAndDots.selectAll("line-circle")
				.data(groupedByDay[i]["values"])
				.enter().append("circle")
				.attr("class", class_prefix + groupedByDay[i]["key"])
				.attr("r", 2)
				.attr("cx", function(d) {
					return x(d.hour);
				})
				.attr("cy", function(d) {
					return y(d.exp);
				})
				.attr("default-opacity", opacity)
				.style("fill", function(d) {
					return d.col;
				})
				.style("opacity", opacity)
				/*.on('mouseover', function(d) {
					d3.select(this).attr("r", 10).style("opacity", 1);
					d3.select(".line" + d.key).style("opacity", 1);
					d3.select("#day-name").text(d.daytag);
				})
				.on('mouseout', function(d) {
					d3.select(this).attr("r", 2);
					d3.select(this).style("opacity", d3.select(this).attr("default-opacity"));
					d3.select(".line" + d.key).style("opacity", 0.2);
					d3.select("#day-name").text("");
				})*/
				.append("svg:title")
				.text(function(d) {
					return d.date;
				});
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
			.attr("cx", function(d) {
				return x(d.date);
			})
			.attr("cy", function(d) {
				return y(d.exp);
			})
			.style("fill", function(d) {
				return d.col;
			})
			.append("svg:title")
			.text(function(d) {
				return d.col + ", " + d.date;
			});
	}
});
