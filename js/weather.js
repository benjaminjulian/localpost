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

function processWeather(blueskyindex, shutter, contrast) {
	if (blueskyindex > 250) {
		return "heiðskýrt";
	} else if (blueskyindex > 100) {
		return "léttskýjað";
	} else if (blueskyindex > 30) {
		return "hálfskýjað";
	} else {
		if (shutter < 1000) {
			return "skýjað";
		} else {
			return "myrkur";
		}
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
		
		var HSL = RGB2HSL(lines[i][1], lines[i][2], lines[i][3]);
		bsi = blueSkyIndex(HSL[0], HSL[1], HSL[2], lines[i][4], lines[i][5], lines[i][6], lines[i][7], lines[i][8]);
		current_weather = processWeather(bsi, lines[i][4], lines[i][7]);

		if (last_weather == "") {
			date_end = lines[i][0];
			last_weather = current_weather;
			last_data = HSL.concat([lines[i][4], lines[i][5]]);
		} else if (current_weather == last_weather) {
			//
		} else {
			newline["begin"] = date_begin;
			newline["end"] = date_end;
			newline["weather"] = last_weather;
			newline["data"] = last_data;
			results[results.length] = newline;
			newline = {};
			if (--count == 0) break;
			
			last_data = HSL.concat([lines[i][4], lines[i][5]]);
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
	headerCell = document.createElement("TH"); headerCell.innerHTML = "H"; row.appendChild(headerCell);
	headerCell = document.createElement("TH"); headerCell.innerHTML = "S"; row.appendChild(headerCell);
	headerCell = document.createElement("TH"); headerCell.innerHTML = "L"; row.appendChild(headerCell);
	headerCell = document.createElement("TH"); headerCell.innerHTML = "spd"; row.appendChild(headerCell);
	headerCell = document.createElement("TH"); headerCell.innerHTML = "gain"; row.appendChild(headerCell);
	
	for (l of data) {
		var diff = getTimeDiff(new Date(l["begin"]), new Date(l["end"]));
		row = table.insertRow();
		if (first) {
			cell = row.insertCell(); cell.innerHTML = "Frá því " + prettyDate(l["begin"]) + " hefur verið " + l["weather"] + ".";
			first = false;
		} else {
			cell = row.insertCell(); cell.innerHTML = "Frá því " + prettyDate(l["begin"]) + " var " + l["weather"] + " í " + diff["value"] + " " + diff["suffix"] + ".";;
		}
		
		for (i = 0; i < l["data"].length; i++) {
			var accuracy = 3;
			o = Math.pow(10,(accuracy-1)-Math.trunc(Math.log10(l["data"][i])));
			cell = row.insertCell(); cell.innerHTML = Math.round(o*l["data"][i])/o;
		}
	}
	return table;
}

function continueProcess() {
	var arr = processArray(rows.response);
	var table = buildTable(arr);
	document.getElementById("table-container").appendChild(table);
}

var rows = requestCSV("../data/col.csv", continueProcess);

