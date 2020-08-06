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

function processWeather(h, s, l, shutter, gain) {
	if (shutter * gain > 10000 || l < 10) {				// nótt
		return "myrkur";
	} else {							// ekki nótt
		if (shutter * gain < 300) {					// sólin skín í vélina (kannski gegnum ský)
			if (h > 170 && h < 280 && 10 * s / shutter > 1) {		// blátt, bjart ljós
				if (10 * s / shutter > 1.3) {					// ofurbjart = sólskin
					if (shutter * gain < 100) {					// ofur-ofurbjart = sólskin með smá skýjum
						return "sól og skýjatægjur";
					} else {
						return "sólarljós";
					}
				} else {							// dimmara = heiðskýrt
					return "heiðskýrt";
				}
			} else {							// bjart ljós
				return "sól bakvið ský";
			}
		} else if (h > 170 && h < 280 && s > 15) {			// sólin skín ekki í vélina, blátt ljós
			if (10 * s / l > 5) {
				return "heiðskýrt";
			} else  if (shutter * gain > 1000) {
				return "skýjað";
			} else {
				return "léttskýjað";
			}
		} else {
			return "skýjað";
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
	
	time2 = cd.getTime();
	time1 = dt.getTime();
	return Math.ceil(Math.abs((time2 - time1) / (24 * 60 * 60 * 1000)));
}

function processArray(lines) {
	var count = 10;
	var results = [];
	var newline = {};
	var date_begin, date_end;
	var last_weather = "";
	var current_weather = "";
	var last_data;
	
	for (i = lines.length; i >= 0; --i) {
		if (typeof(lines[i]) == "undefined") continue;
		
		var HSL = RGB2HSL(lines[i][1], lines[i][2], lines[i][3]);
		current_weather = processWeather(HSL[0], HSL[1], HSL[2], lines[i][4], lines[i][5]);

		if (last_weather == "") {
			date_end = lines[i][0];
			last_weather = current_weather;
		} else if (current_weather == last_weather) {
			//
		} else {
			newline["begin"] = date_begin;
			newline["end"] = date_end;
			newline["weather"] = last_weather;
			newline["data"] = last_data;
			results[results.length] = newline;
			console.log(newline);
			console.log("pushed to array");
			console.log(results);
			newline = {};
			if (--count == 0) break;
			
			date_end = lines[i][0];
			last_weather = current_weather;
		}
		
		date_begin = lines[i][0];
		last_data = HSL.concat([lines[i][4], lines[i][5]]);
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
			cell = row.insertCell(); cell.innerHTML = "Frá því " + prettyDate(l["begin"]) + " hefur verið ";
			first = false;
		} else {
			cell = row.insertCell(); cell.innerHTML = "Frá því " + prettyDate(l["begin"]) + " var ";
		}
		cell.innerHTML += l["weather"] + " í " + diff["value"] + " " + diff["suffix"] + ".";
		
		for (i = 0; i < l["data"].length; i++) {
			cell = row.insertCell(); cell.innerHTML = Math.round(l["data"][i]);
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

