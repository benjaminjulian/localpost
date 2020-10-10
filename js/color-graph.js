var show_grouped = true;

function setDate() {
	dt = document.getElementById("day").value;
	cl = "line" + dt;
	lines = document.getElementsByClassName("line");
	
	for (i = 0; i < lines.length; i++) {
		lines[i].style.opacity = 0;
	}
	
	line = document.getElementsByClassName(cl);
	
	for (i = 0; i < line.length; i++) {
		line[i].style.opacity = 1;
	}
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
	
	return prefix;// + "  kl. " + dt.getHours() + ":" + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
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
var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
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
				
		h = d.h * 1.0;
		s = d.s * 1.0;
		v = d.v * 1.0;
		gain = d.gain * 1.0;
		speed = d.shutter * 1.0;
		std_h = d.std_h * 1.0;
		std_s = d.std_s * 1.0;
		std_v = d.std_v * 1.0;
		edges = d.edges * 1.0;
		contrast = d.contrast * 1.0;
		
		d.puff = (Math.pow(edges, 2) * contrast / 130 + std_s) / Math.pow(gain, 2);
		d.stratification = v  * Math.abs(230 - h) / (Math.max(s, 1) * Math.max(std_h, 1) * Math.max(std_v, 1));
		d.darkness = Math.sqrt(speed * gain) / 12;
		d.blueness = 1.4 * s * Math.pow(Math.max(0, 100 - Math.abs(230 - h)), 1/gain) / Math.max(50 * std_v * Math.pow(gain, 3),1) / (1+(Math.abs(speed-4000)+speed-4000)/500);
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
	y.domain([0,50/*d3.min(data, function(d) {
		return d.exp;
	}), d3.max(data, function(d) {
		return d.exp;
	})*/]);

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
	/*svg.append("text")
		.attr("x", width / 2)
		.attr("y", height / 2)
		.attr("id", "day-name")
		.attr("class", "outline-text")
		.style("text-anchor", "middle")
		.style("dominant-baseline", "middle")
		.style("font-size", "120px")
		.style("font-weight", "bold")
		.style("fill", "black")
		.style("opacity", 0.1)
		.text("");*/

	if (show_grouped) {
		var today = new Date();
		var today_str = today.getFullYear()+'-'+pad(today.getMonth()+1,2)+'-'+pad(today.getDate(),2);
		for (var i = 0; i < groupedByDay.length; i++) {
			opt = document.createElement("option");
			opt.value = groupedByDay[i]["key"];
			opt.innerHTML = prettyDate(groupedByDay[i]["key"]);
			
			if (today_str === groupedByDay[i]["key"]) {
				opt.selected = true;
				class_prefix = "today line line";
				opacity = 1;
			} else {
				class_prefix = "line line";
				opacity = 0;
			}
			
			document.getElementById("day").appendChild(opt);
			
			var line_blue = svg.append("path")
					.datum(groupedByDay[i]["values"])
					.attr("fill", "none")
					.attr("class", class_prefix + groupedByDay[i]["key"])
					.attr("stroke", "darkblue")
					.attr("stroke-width", 2)
					.attr("d", d3.svg.line()
					      		.x(function(d) {
								return x(d.hour);
								})
					      		.y(function(d) {
								return y(d.blueness);
								}))
					.style("opacity", opacity);
			var line_puff = svg.append("path")
					.datum(groupedByDay[i]["values"])
					.attr("fill", "none")
					.attr("class", class_prefix + groupedByDay[i]["key"])
					.attr("stroke", "cornflowerblue")
					.attr("stroke-width", 2)
					.attr("d", d3.svg.line()
					      		.x(function(d) {
								return x(d.hour);
								})
					      		.y(function(d) {
								return y(d.puff);
								}))
					.style("opacity", opacity);
			var line_stratification = svg.append("path")
					.datum(groupedByDay[i]["values"])
					.attr("fill", "none")
					.attr("class", class_prefix + groupedByDay[i]["key"])
					.attr("stroke", "gray")
					.attr("stroke-width", 2)
					.attr("d", d3.svg.line()
					      		.x(function(d) {
								return x(d.hour);
								})
					      		.y(function(d) {
								return y(d.stratification);
								}))
					.style("opacity", opacity);
			var line_darkness = svg.append("path")
					.datum(groupedByDay[i]["values"])
					.attr("fill", "none")
					.attr("class", class_prefix + groupedByDay[i]["key"])
					.attr("stroke", "black")
					.attr("stroke-width", 2)
					.attr("d", d3.svg.line()
					      		.x(function(d) {
								return x(d.hour);
								})
					      		.y(function(d) {
								return y(d.darkness);
								}))
					.style("opacity", opacity);
			svg.append("text")
					.attr("x", 20)
					.attr("y", 70)
					.style("font-size", "12px")
					.style("fill", "darkblue")
					.style("opacity", 1)
					.text("Heiðskýrt");
			svg.append("text")
					.attr("x", 20)
					.attr("y", 85)
					.style("font-size", "12px")
					.style("fill", "cornflowerblue")
					.style("opacity", 1)
					.text("Skýjabólstrar");
			svg.append("text")
					.attr("x", 20)
					.attr("y", 100)
					.style("font-size", "12px")
					.style("fill", "gray")
					.style("opacity", 1)
					.text("Skýjað");
			svg.append("text")
					.attr("x", 20)
					.attr("y", 115)
					.style("font-size", "12px")
					.style("fill", "black")
					.style("opacity", 1)
					.text("Myrkur");
/*
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

			if (today_str === groupedByDay[i]["key"]) {
				lineAndDots.selectAll("line-circle")
					.data(groupedByDay[i]["values"])
					.enter().append("circle")
					.attr("class", class_prefix + groupedByDay[i]["key"])
					.attr("r", function(d) { return d.rad*1.2; })
					.attr("cx", function(d) {
						return x(d.hour);
					})
					.attr("cy", function(d) {
						return y(d.exp);
					})
					.style("fill", "black")
					.style("opacity", 1)
					.append("svg:title")
					.text(function(d) {
						return d.date;
					});
			}
			lineAndDots.selectAll("line-circle")
				.data(groupedByDay[i]["values"])
				.enter().append("circle")
				.attr("class", class_prefix + groupedByDay[i]["key"])
				.attr("r", function(d) { return d.rad; })
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
				.on('mouseover', function(d) {
					d3.select(".line" + d.key).style("opacity", 1);
					d3.select(this).style("opacity", 1);
					d3.select("#day-name").text(d.daytag);
				})
				.on('mouseout', function(d) {
					d3.select(this).style("opacity", d3.select(this).attr("default-opacity"));
					d3.select(".line" + d.key).style("opacity", 0.1);
					d3.select("#day-name").text("");
				})
				.append("svg:title")
				.text(function(d) {
					return d.date;
				});*/
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
