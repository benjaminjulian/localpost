function blueSkyIndex(h, s, l, shutter, gain, stdh, stdl, stds, redgain, bluegain) {
	console.log([h, s, l, shutter, gain, stdh, stdl, stds, redgain, bluegain]);
	var daycolor = 10 * s / shutter;
	var darkness = shutter * gain;
	
	var colclarity = Math.abs(l-50);
	colclarity = (50 - colclarity) * s / 100;

	var h_dist = Math.abs(h-230);
	var h_dist_ind = h_dist > 100 ? 0 : 100 - h_dist;
	wb = Math.sqrt(redgain / bluegain);
	h_dist_ind *= 10 * wb;
	h_dist_ind = Math.pow(h_dist_ind, 1.5) / 10000

	return Math.round(h_dist_ind * stdl * (s / (Math.sqrt(stdh) * 100) + colclarity));
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
