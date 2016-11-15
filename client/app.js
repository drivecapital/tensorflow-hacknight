(function () {

	'use strict';

	function Image(width, height, pixels) {
		this.width = width;
		this.height = height;
		this.pixels = pixels;
	}

	Image.fromCanvas = function (canvas) {
		var context = canvas.getContext('2d');
		var imageData = context.getImageData(1, 1, canvas.width, canvas.height);
		return Image.fromImageData(imageData);
	};

	Image.fromImageData = function (imageData) {
		var sample = new Float32Array(imageData.width * imageData.height);
		var i;

		for (i = 0; i < sample.length; i++) {
			sample[i] = imageData.data[i * 4 + 3] / 255;
		}

		return new Image(imageData.width, imageData.height, sample);
	};

	Image.prototype.getBoundingRect = function (threshold) {
		if (typeof threshold === 'undefined') {
			threshold = 0.01;
		}

		var minX = Infinity;
		var minY = Infinity;
		var maxX = -Infinity;
		var maxY = -Infinity;
		var x, y, pixel;

		for (y = 0; y < this.height; y++) {
			for (x = 0; x < this.width; x++) {
				pixel = this.pixels[y * this.width + x];
				if (pixel > threshold) {
					minX = Math.min(x, minX);
					minY = Math.min(y, minY);
					maxX = Math.max(x, maxX);
					maxY = Math.max(y, maxY);
				}
			}
		}

		return minX === Infinity
			? [0, 0, 1, 1]
			: [
				minX / this.width,
				minY / this.height,
				(maxX - minX) / this.width,
				(maxY - minY) / this.height
			];
	};

	Image.prototype.getBoundingSquare = function (threshold) {
		return getBoundingSquare(this.getBoundingRect(threshold));
	};

	Image.prototype.getCenterOfMass = function () {
		var sumX = 0;
		var sumY = 0;
		var sum = 0;
		var x, y, pixel;

		for (y = 0; y < this.height; y++) {
			for (x = 0; x < this.width; x++) {
				pixel = this.pixels[y * this.width + x];
				sumX += pixel * x / this.width;
				sumY += pixel * y / this.height;
				sum += pixel;
			}
		}

		return sum > 0 ? [sumX / sum, sumY / sum] : [0.5, 0.5];
	};

	/*
	 * Given a rectangle defined by [top, left, width, height], returns the
	 * smallest square containing the rectangle in its center.
	 */
	function getBoundingSquare(rect) {
		var left = rect[0];
		var top = rect[1];
		var width = rect[2];
		var height = rect[3];
		var diff = width - height;

		if (diff > 0) { // width > height, pad height
			return [
				left,
				top - diff / 2,
				width,
				height + diff
			];
		} else if (diff < 0) { // width < height, pad width
			return [
				left + diff / 2,
				top,
				width - diff,
				height
			];
		} else { // width = height, no padding
			return rect;
		}
	}

	function preprocess($original, srcPaths) {
		function fromSrc(srcX, srcY) {
			return [
				(srcX - srcLeft) / srcWidth,
				(srcY - srcTop) / srcHeight
			];
		}

		function toDest(x, y) {
			return [
				destLeft + x * destWidth,
				destTop + y * destHeight
			];
		}

		function adjust(srcX, srcY) {
			var coords = fromSrc(srcX, srcY);
			return toDest(coords[0] + dx, coords[1] + dy);
		}

		var $canvas = document.createElement('canvas');
		$canvas.width = $original.width;
		$canvas.height = $original.height;

		render($canvas, srcPaths);
		var image = Image.fromCanvas($canvas);

		var srcRect = image.getBoundingSquare();
		var srcLeft = srcRect[0];
		var srcTop = srcRect[1];
		var srcWidth = srcRect[2];
		var srcHeight = srcRect[3];
		var srcAspectRatio = srcWidth / srcHeight;

		var destRect = getBoundingSquare([
			(1 - BOX_WIDTH / SAMPLE_WIDTH) / 2,
			(1 - BOX_HEIGHT / SAMPLE_HEIGHT) / 2,
			BOX_WIDTH / SAMPLE_WIDTH,
			BOX_HEIGHT / SAMPLE_HEIGHT
		]);
		var destLeft = destRect[0];
		var destTop = destRect[1];
		var destWidth = destRect[2];
		var destHeight = destRect[3];
		var destAspectRatio = destWidth / destHeight;

		var scale = destWidth / srcWidth;

		var center = image.getCenterOfMass();
		var srcCenter = fromSrc(center[0], center[1])
		var dx = 0.5 - srcCenter[0];
		var dy = 0.5 - srcCenter[1];

		var destPaths = new Array(srcPaths.length);

		var i, j, srcPath, destPath, srcCoords, destCoords;

		for (i = 0; i < srcPaths.length; i++) {
			srcPath = srcPaths[i];
			destPath = new Array(srcPath.length);
			destPaths[i] = destPath;
			for (j = 0; j < srcPath.length; j++) {
				srcCoords = srcPath[j];
				destPath[j] = adjust(srcCoords[0], srcCoords[1]);
			}
		}

		return destPaths;
	}

	var CANVAS_HEIGHT = 280;
	var CANVAS_WIDTH = 280;
	var SAMPLE_HEIGHT = 28;
	var SAMPLE_WIDTH = 28;
	var BOX_WIDTH = 20;
	var BOX_HEIGHT = 20;

	var $app = document.getElementById('app');

	var $clear = document.getElementById('clear');
	$clear.addEventListener('click', clear);

	var $canvas = document.getElementById('canvas');
	$canvas.height = CANVAS_HEIGHT;
	$canvas.width = CANVAS_WIDTH;
	$canvas.style.outline = '1px solid black';

	var $export = document.getElementById('export');
	$export.addEventListener('click', function () {
		preprocess($canvas, paths);
		var image = Image.fromCanvas($sample);
		$output.value = JSON.stringify([].slice.call(image.pixels));
	});

	var $output = document.getElementById('output');

	var $sample = document.getElementById('sample');
	$sample.height = SAMPLE_HEIGHT;
	$sample.width = SAMPLE_WIDTH;
	$sample.style.outline = '1px solid black';

	var offsetLeft = $canvas.offsetLeft;
	var offsetTop = $canvas.offsetTop;
	var paths = [];
	var currentPath = null;

	$canvas.addEventListener('mousedown', beginPath, false);
	$canvas.addEventListener('mousemove', move, false);
	$canvas.addEventListener('mouseout', endPath, false);
	$canvas.addEventListener('mouseup', endPath, false);

	function beginPath(event) {
		if (!currentPath) {
			currentPath = [];
		}

		move(event);
	}

	function clear(event) {
		paths = [];
		currentPath = null;
		update();
	}

	function endPath(event) {
		move(event);

		if (currentPath) {
			paths.push(currentPath);
			currentPath = null;
		}
	}

	function move(event) {
		if (currentPath) {
			var x = (event.clientX - offsetLeft) / event.target.width;
			var y = (event.clientY - offsetTop) / event.target.height;

			currentPath.push([x, y]);

			update();
		}
	}

	function render(canvas, paths) {
		var ctx = canvas.getContext('2d');
		var height = canvas.height;
		var width = canvas.width;
		var i;

		function renderPath(path) {
			var j;
			ctx.moveTo(path[0][0] * width, path[0][1] * height);
			for (j = 0; j < path.length; j++) {
				ctx.lineTo(path[j][0] * width, path[j][1] * height);
			}
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.lineCap = 'round';
		ctx.lineWidth = 3;
		ctx.strokeStyle = 'black';
		ctx.beginPath();
		for (i = 0; i < paths.length; i++) {
			renderPath(paths[i]);
		}
		ctx.stroke();
	}

	var animationRequested = false;
	function update() {
		if (!animationRequested) {
			animationRequested = true;
			requestAnimationFrame(function () {
				animationRequested = false;
				var renderPaths = paths;
				if (currentPath) {
					renderPaths = renderPaths.concat([currentPath]);
				}

				render($canvas, renderPaths);
				render($sample, preprocess($canvas, renderPaths));
			});
		}
	}

}());
