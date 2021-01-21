function requestCSV(f, c) {
	return new CSVAJAX(f, c);
};

function CSVAJAX(filepath, callback) {
	this.request = new XMLHttpRequest();
	this.request.timeout = 10000;
	this.request.open("GET", filepath, true);
	this.request.parent = this;
	this.callback = callback;
	this.request.onload = function() {
		var d = this.response.split('\n'); /*1st separator*/
		var i = d.length;
		while (i--) {
			if (d[i] !== "")
				d[i] = d[i].split(','); /*2nd separator*/
			else
				d.splice(i, 1);
		}
		this.parent.response = d;
		if (typeof this.parent.callback !== "undefined")
			this.parent.callback(d);
	};
	this.request.send();
}

function howClear(blueness, puff) {
	if (blueness / puff > 1.7) { return "heiðskýrt"; }
	else if (puff / blueness > 1.7) { return "bólstraskýjað"; }
	else { return "léttskýjað"; }
}

function processWeather(blueness, puff, stratification, darkness) {
	val = Math.max(blueness, puff, stratification, darkness);
	
	switch (val) {
		case blueness: return howClear(blueness, puff);
		case puff: return howClear(blueness, puff);
		case stratification: return "þéttskýjað";
		case darkness: return "myrkur";
		default: return "ekkert";
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

function processArray(lines) {
	var count = 11;
	var results = [];
	var newline = {};
	var date_begin, date_end;
	var last_weather = "";
	var current_weather = "";
	var last_data;
	
	for (i = lines.length; i >= 0; --i) {
		if (typeof(lines[i]) == "undefined") continue;
		
		speed = lines[i][1] * 1.0;
		gain = lines[i][2] * 1.0;
		h = lines[i][3] * 1.0;
		s = lines[i][4] * 1.0;
		v = lines[i][5] * 1.0;
		std_h = lines[i][6] * 1.0;
		std_s = lines[i][7] * 1.0;
		std_v = lines[i][8] * 1.0;
		edges = lines[i][9] * 1.0;
		contrast = lines[i][10] * 1.0;
		
		weathers = [];
		shutter_cutoff = 8000;
		
		if (std_v == 0) {
			weathers.push("myrkur");
		}
		if (Math.abs(h-230) < 10 && s > 35 && speed < shutter_cutoff) {
			weathers.push("heiðskýrt");
		}
		if ((edges > 6 && speed < shutter_cutoff) || (edges > 5 && gain < 8)) {
			weathers.push("bólstraskýjað");
		}
		if (h > 240 && edges < 7) {
			weathers.push("skýjað");
		}
		
		current_weather = weathers.join();//processWeather(blueness, puff, stratification, darkness);
		console.log(current_weather);

		if (last_weather == "") {
			date_end = lines[i][0];
			last_weather = current_weather;
		} else if (current_weather == last_weather) {
			//
		} else {
			newline["begin"] = date_begin;
			newline["end"] = date_end;
			newline["weather"] = last_weather;
			results[results.length] = newline;
			
			newline = {};
			if (--count == 0) break;
			
			date_end = lines[i][0];
			last_weather = current_weather;
		}
		
		date_begin = lines[i][0];
	}
	return results;
}

function buildTable(data) {
	var first = true;
	
	table = document.createElement("table");
	row = table.insertRow();
	headerCell = document.createElement("TH"); headerCell.innerHTML = "Veður"; row.appendChild(headerCell);
	
	for (l of data) {
		var diff = getTimeDiff(new Date(l["begin"]), new Date(l["end"]));
		row = table.insertRow();
		if (first) {
			cell = row.insertCell(); cell.innerHTML = "Frá því " + prettyDate(l["begin"]) + " hefur verið " + l["weather"] + ".";
			first = false;
		} else {
			cell = row.insertCell(); cell.innerHTML = "Frá því " + prettyDate(l["begin"]) + " var " + l["weather"] + " í " + diff["value"] + " " + diff["suffix"] + ".";;
		}
	}
	return table;
}

function continueProcess() {
	var arr = processArray(rows.response);
	var table = buildTable(arr);
	document.getElementById("table-container").appendChild(table);
}

var rows = requestCSV(document.currentScript.getAttribute('filename'), continueProcess);

