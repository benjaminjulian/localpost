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
		return "Myrkur";
	} else {							// ekki nótt
		if (shutter * gain < 300) {					// sólin skín í vélina (kannski gegnum ský)
			if (h > 170 && h < 280 && 10 * s / shutter > 1) {		// blátt, bjart ljós
				if (10 * s / shutter > 1.3) {					// ofurbjart = sólskin
					if (shutter * gain < 100) {					// ofur-ofurbjart = sólskin með smá skýjum
						return "Sól og skýjatægjur";
					} else {
						return "Sólarljós";
					}
				} else {							// dimmara = heiðskýrt
					return "Heiðskýrt";
				}
			} else {							// bjart ljós
				return "Sól bakvið ský";
			}
		} else if (h > 170 && h < 280 && s > 15) {			// sólin skín ekki í vélina, blátt ljós
			if (10 * s / l > 5) {
				return "Heiðskýrt";
			} else  if (shutter * gain > 1000) {
				return "Skýjað";
			} else {
				return "Léttskýjað";
			}
		} else {
			return "Skýjað";
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
		prefix = "Í dag";
	} else {
		var diff = getTimeDiff(dt, new Date());
		
		if (diff["suffix"] == "dag" || diff["suffix"] == "klst") {
			switch (daysAgo(d)) {
				case 1: prefix = "í gær"; break;
				case 2: prefix = "í fyrradag"; break;
				default: prefix = "fyrir " + daysAgo(d) + " dögum";
			}
		} else {
			prefix = "Fyrir " + diff["suffix"];
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

function process(lines) {
	var rowcount = 0;
	var date_begin;
	var date_end;
	var last = "";
	var current = "";
	var storehue = 0;
	var cell;
	table = document.createElement("table");
	row = table.insertRow();
		headerCell = document.createElement("TH"); headerCell.innerHTML = "Veður"; row.appendChild(headerCell);
		headerCell = document.createElement("TH"); headerCell.innerHTML = "H"; row.appendChild(headerCell);
		headerCell = document.createElement("TH"); headerCell.innerHTML = "S"; row.appendChild(headerCell);
		headerCell = document.createElement("TH"); headerCell.innerHTML = "L"; row.appendChild(headerCell);
		headerCell = document.createElement("TH"); headerCell.innerHTML = "spd"; row.appendChild(headerCell);
		headerCell = document.createElement("TH"); headerCell.innerHTML = "gain"; row.appendChild(headerCell);
	
	for (i = lines.length - 1; i >= 0; i--) {
		var HSL = RGB2HSL(lines[i][1], lines[i][2], lines[i][3]);
		
		current = processWeather(HSL[0], HSL[1], HSL[2], lines[i][4], lines[i][5]);
		
		if (last == "") {
			row = table.insertRow();
			cell = row.insertCell();
			cell.innerHTML = "Frá því " + prettyDate(lines[i][0]) + " hefur verið ";
			date_begin = lines[i][0];
		} else if (current == last) {
			//
		} else {
			var diff = getTimeDiff(new Date(date_begin), new Date(date_end));
			//cell = row.insertCell(); cell.innerHTML = diff["value"] + " " + diff["suffix"];
			cell.innerHTML += last + " í " + diff["value"] + " " + diff["suffix"];
			for (n = 0; n < storehue.length; n++) {
				cell = row.insertCell(); cell.innerHTML = Math.round(storehue[n]);
			}
			if (++rowcount === 10) {
				break;
			} else {
				row = table.insertRow();
				cell = row.insertCell(); cell.innerHTML = "Frá því " + prettyDate(lines[i][0]) + " var ";
				date_begin = lines[i][0];
			}
		}
		last = current;
		date_end = lines[i][0];
		var storehue = HSL.concat([lines[i][4], lines[i][5]]);
	}
	
	document.getElementById("table-container").appendChild(table);
}

var rows = requestCSV("../data/col.csv", process);
