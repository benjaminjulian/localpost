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
	if (shutter * gain > 6000 || l < 10) {
		return "Myrkur";
	} else if (s < 12) {
		if (shutter * gain < 200) {
			return "Skýjað/sól";
		} else {
			return "Skýjað";
		}
	} else if (h > 180 && h < 270) {
		if (s < 50) {
			return "Hálfskýjað";
		} else if (s < 75) {
			return "Léttskýjað";
		} else {
			return "Heiðskýrt";
		}
	} else {
		return "<b>Veður?</b>";
	}
}

function process(lines) {
	var last = "";
	var current = "";
	var storedate = "";
	var storehue = 0;
	table = document.createElement("table")
	row = table.insertRow();
		cell = row.insertCell(); cell.innerHTML = "Frá";
		cell = row.insertCell(); cell.innerHTML = "Til";
		cell = row.insertCell(); cell.innerHTML = "Veður";
		cell = row.insertCell(); cell.innerHTML = "Upplýsingar";
	
	for (i = 1; i < lines.length; i++) {
		var HSL = RGB2HSL(lines[i][1], lines[i][2], lines[i][3]);
		
		current = processWeather(HSL[0], HSL[1], HSL[2], lines[i][4], lines[i][5]);
		
		if (last == "") {
			row = table.insertRow();
			cell = row.insertCell();
			cell.innerHTML = lines[i][0];
		} else if (current == last) {
			//
		} else {
			cell = row.insertCell(); cell.innerHTML = storedate;
			cell = row.insertCell(); cell.innerHTML = last;
			cell = row.insertCell(); cell.innerHTML = storehue.toString();
			row = table.insertRow();
			cell = row.insertCell(); cell.innerHTML = lines[i][0];
		}
		last = current;
		storedate = lines[i][0];
		var storehue = HSL[0];
	}
	cell = row.insertCell(); cell.innerHTML = storedate;
	cell = row.insertCell(); cell.innerHTML = last;
	
	document.getElementById("table-container").appendChild(table);
}

var rows = requestCSV("../data/col.csv", process);
