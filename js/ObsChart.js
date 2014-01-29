/**
 * @author Gareth Mula
 */
var xInterval = 5; // Units represented by each interval
var xIntervalThick = 3; // Multiples of lines to make 'thick'. i.e every 15 minutes

var yInterval = 10; // 10mmHg intervals
var yIntervalThick = 5; // 50 mmHg

var xOffset = 0; // Line offset (for scrolling)
var yOffset = 0;

var marginTop = 30;
var marginBottom = 20;
var marginLeft = 60;
var marginRight = 20;

var canvasSizeNoMargin = view.bounds;
var canvasSize = new Size(view.bounds);

canvasSize.width = canvasSizeNoMargin.width - marginLeft - marginRight;
canvasSize.height = canvasSizeNoMargin.height - marginTop - marginBottom;

var minX = 0; // Min Time
var maxX = 120; // Max Time in minutes
var minY = 0; // Min BP
var maxY = 240; // Max BP

var rangeX = maxX - minX;
var rangeY = maxY - minY;

// Set grid resolution before scaling.
// Pixels per interval
var ppuX = 10;
var ppuY = 2;

var currW = rangeX * ppuX;

var mmHg = 100;

// Draw the grid for observations
// w,h = size
// intX = unit interval
// 
function Grid(w, h) {
	gridGroup = new Group();
	gridGroup.onMouseDrag = function(event) {
		// If we drag up or down, change the systolic value
		var xmove = event.delta.x;
		gridGroup.position.x += xmove;
		obsGroup.position.x += xmove;
	};
	
	obsGroup = new Group();
	
	var gWidth = w;
	var gHeight = h;
	var xInterval = 40;
	var yInterval = 20;
	
	var minX = 0;
	var maxX = 240;
	var minY = 0;
	var maxY = 250;
	
	// If fitTo is true, resize grid to fit entire range into area.
	var fitToX = false;
	var fitToY = false;
	
	// Units per interval;
	var upiX = 5; // 5 minutes per vertical line
	var upiY = 10; // 10 mmHg per horizontal line
	
	var boldIntervalX = 0;
	var boldIntervalY = 0;
	
	var obs = [];
	
	var dragborder = 2;
	
	this.setBP = function(syst,dias, time) {
		this.setSystolic(syst, time);
		this.setDiastolic(dias, time);
	};
	
	this.getObAtTime = function(ob, time) {
		for (var i=0; i < obs.length; i++) {
		  if(obs[i].time==time) {
		  	if(typeof obs[i][ob] !== 'undefined') {
		  		return obs[i][ob];
		  	} else {
		  		return false;
		  	}
		  }
		}
	};
	
	this.setHR = function(hr, time) {
		// Check current
		for (var i=0; i < obs.length; i++) {
		  if(obs[i].time==time) {
		  	obs[i].hr = hr;
		  	return;
		  }
		};
		var newOb = {time: time, hr: hr};
		obs.push(newOb);
	};
	
	this.setSystolic = function(syst, time) {
		// Check current
		for (var i=0; i < obs.length; i++) {
		  if(obs[i].time==time) {
		  	obs[i].systolic = syst;
		  	this.setMean(time);
		  	return;
		  }
		};
		var newOb = {time: time, systolic: syst};
		obs.push(newOb);
	};

	this.setDiastolic = function(dias, time) {
		// Check current
		for (var i=0; i < obs.length; i++) {
		  if(obs[i].time==time) {
		  	obs[i].diastolic = dias;
		  	this.setMean(time);
		  	return;
		  }
		};
		var newOb = {time: time, diastolic: dias};
		obs.push(newOb);
	};
	
	this.setMean = function(time) {
		// MAP
		for (var i=0; i < obs.length; i++) {
		  if(obs[i].time==time) {
		  	if(obs[i].systolic > 0 && obs[i].diastolic > 0) {
		  		pulsepress = obs[i].systolic - obs[i].diastolic;
		  		obs[i].mean = Math.floor(obs[i].diastolic + (pulsepress/3));
		  		return;
		  	}
		  }
		};
	};
	
	this.drawObs = function() {
		obsGroup.remove();
		obsGroup = new Group();
		
		obsRect = new Path.Rectangle(new Point(0,0), new Size(gWidth, gHeight));
		obsRect.strokeColor = 'black';
		obsRect.strokeWidth = 4;
		obsRect.opacity = 0;
		obsGroup.appendTop(obsRect);
		
		for (var i=0; i < obs.length; i++) {
			
			if(typeof obs[i].systolic !== 'undefined') {
				
				syst = this.drawSystolic(obs[i].time, obs[i].systolic);
				obsGroup.appendTop(syst);
			}
			
			if(typeof obs[i].diastolic !== 'undefined') {
				dias = this.drawDiastolic(obs[i].time, obs[i].diastolic);
				obsGroup.appendTop(dias);
			}
			if(typeof obs[i].systolic !== 'undefined' && typeof obs[i].diastolic !== 'undefined') {
				conn = this.drawConnector(obs[i].time, obs[i].systolic, obs[i].diastolic);
				obsGroup.appendTop(conn);
				
				mapcoords = this.getCoords(obs[i].time, obs[i].mean);
				map = this.drawMean(mapcoords.x, mapcoords.y);
				obsGroup.appendTop(map);
			}
			
			if(typeof obs[i].hr !== 'undefined') {
				hrob = this.drawHR(obs[i].time, obs[i].hr);
				obsGroup.appendTop(hrob);
			}
		};
		
		obsGroup.position.x = gridGroup.position.x;
	};
	
	this.drawMean = function(cx, cy) {
		var crosssize = 6;
		var crosspath = new Path();
		crosspath.strokeColor = 'black';
		crosspath.strokeWidth = 3;
		
		leftCoord = new Point(cx - crosssize, cy);
		rightCoord = new Point(cx + crosssize, cy);
	
		crosspath.moveTo(leftCoord);
		crosspath.lineTo(rightCoord);
		
		return crosspath;
	};
	
	this.drawConnector = function(time, systolic, diastolic) {
		var connectorpath = new Path();
		connectorpath.strokeColor = 'black';
		connectorpath.strokeWidth = 3;
		
		systcoords = this.getCoords(time,systolic);
		cx = systcoords.x;
		ystart = systcoords.y;
		diascoords = this.getCoords(time,diastolic);
		yend = diascoords.y;
		
		topCoord = new Point(cx, ystart);
		bottomCoord = new Point(cx, yend);
	
		connectorpath.moveTo(topCoord);
		connectorpath.lineTo(bottomCoord);
		
		return connectorpath;
	};
	
	this.drawSystolic = function(time, val) {
		var arrowgroup = new Group();
		arrowgroup.data.systolic = val;
		arrowgroup.data.time = time;
		
		systcoords = this.getCoords(time,val);
		cx = systcoords.x;
		cy = systcoords.y;
		
		var arrowsize = 10;
		var arrow = new Path();
		arrow.strokeColor = 'black';
		arrow.strokeWidth = 4;
		
		centerCoord = new Point(cx, cy);
		leftCoord = new Point(cx - arrowsize, cy - arrowsize);
		rightCoord = new Point(cx + arrowsize, cy - arrowsize);
		
		arrow.moveTo(leftCoord);
		arrow.lineTo(centerCoord);
		arrow.lineTo(rightCoord);
		
		arrowgroup.appendTop(arrow);
		
		arrowbg = new Path.Rectangle({
			point: [cx - arrowsize - dragborder, cy - arrowsize - dragborder],
			size: [(arrowsize + dragborder) * 2, arrowsize + (dragborder * 2)],
			strokeColor: 'black',
			fillColor: new Color(1, 0, 0),
			opacity: 0
		});
		arrowgroup.appendBottom(arrowbg);
		
		systext = new PointText(arrowgroup.position);
		systext.justification = 'center';
		systext.fillColor = 'black';
		systext.fontWeight = 'bold';
		systext.fontSize = 20;
		systext.visible = false;
		
		newval = 0;
		
		arrowgroup.onClick = function(event) {
			
		};
		
		arrowgroup.onMouseDrag = function(event) {
			// If we drag up or down, change the systolic value
			var systolicChange = event.delta.y;
			
			gr = rect;
			
			this.newval = gr.coordsToVal(this.position);
			this.diastolicHere = gr.getObAtTime('diastolic', this.data.time);
			
			this.tempMove = new Point(this.position.x, this.position.y + systolicChange);
			this.tempval = gr.coordsToVal(this.tempMove);
			if(this.tempval.y > this.diastolicHere) {
				this.position.y += systolicChange;
	
				systext.content = this.tempval.y;
				systext.position.x = this.position.x + 30;
				systext.position.y = this.position.y;
				systext.visible = true;
			}
		};
		
		arrowgroup.onMouseUp = function(event) {
			systext.visible = false;
			
			gr.setSystolic(this.newval.y, this.data.time);
			gr.drawObs();
		};

		return arrowgroup;
	};
	this.drawDiastolic = function(time, val) {
		var arrowgroup = new Group();
		arrowgroup.data.diastolic = val;
		arrowgroup.data.time = time;
		
		diascoords = this.getCoords(time,val);
		cx = diascoords.x;
		cy = diascoords.y;
		
		var arrowsize = 10;
		var arrow = new Path();
		arrow.strokeColor = 'black';
		arrow.strokeWidth = 4;
		
		centerCoord = new Point(cx, cy);
		leftCoord = new Point(cx - arrowsize, cy + arrowsize);
		rightCoord = new Point(cx + arrowsize, cy + arrowsize);
		
		arrow.moveTo(leftCoord);
		arrow.lineTo(centerCoord);
		arrow.lineTo(rightCoord);
		
		arrowgroup.appendTop(arrow);
		
		arrowbg = new Path.Rectangle({
			point: [cx - arrowsize - dragborder, cy - arrowsize - dragborder],
			size: [(arrowsize + dragborder) * 2, arrowsize + (dragborder * 2)],
			strokeColor: 'black',
			fillColor: new Color(1, 0, 0),
			opacity: 0
		});
		arrowgroup.appendBottom(arrowbg);
		
		systext = new PointText(arrowgroup.position);
		systext.justification = 'center';
		systext.fillColor = 'black';
		systext.fontWeight = 'bold';
		systext.fontSize = 20;
		systext.visible = false;
		
		newval = 0;
		
		arrowgroup.onClick = function(event) {
			
		};
		
		arrowgroup.onMouseDrag = function(event) {
			// If we drag up or down, change the systolic value
			var diastolicChange = event.delta.y;
			
			gr = rect;
			
			this.newval = gr.coordsToVal(this.position);
			this.systolicHere = gr.getObAtTime('systolic', this.data.time);
			
			this.tempMove = new Point(this.position.x, this.position.y + diastolicChange);
			this.tempval = gr.coordsToVal(this.tempMove);
			if(this.tempval.y < this.systolicHere) {
				this.position.y += diastolicChange;
	
				systext.content = this.tempval.y;
				systext.position.x = this.position.x + 30;
				systext.position.y = this.position.y;
				systext.visible = true;
			}
		};
		
		arrowgroup.onMouseUp = function(event) {
			systext.visible = false;
			
			gr.setDiastolic(this.newval.y, this.data.time);
			gr.drawObs();
		};

		return arrowgroup;
	};
	
	this.drawHR = function(time, val) {
		hrgroup = new Group();
		hrgroup.data.hr = val;
		hrgroup.data.time = time;
		
		hrcoords = this.getCoords(time,val);
		cx = hrcoords.x;
		cy = hrcoords.y;
		
		var hrate = new Path.Circle(new Point(cx, cy), 6);
		hrate.fillColor = 'red';
		hrgroup.appendTop(hrate);
		
		var hrbg = new Path.Circle(new Point(cx,cy), 10);
		hrbg.opacity = 0.5;
		hrgroup.appendBottom(hrbg);
		
		systext = new PointText(hrgroup.position);
		systext.justification = 'center';
		systext.fillColor = 'black';
		systext.fontWeight = 'bold';
		systext.fontSize = 20;
		systext.visible = false;
		
		newval = 0;
		
		hrgroup.onClick = function(event) {
			
		};
		
		hrgroup.onMouseDrag = function(event) {
			// If we drag up or down, change the systolic value
			var hrChange = event.delta.y;
			
			gr = rect;
			
			this.newval = gr.coordsToVal(this.position);
			this.hrHere = gr.getObAtTime('hr', this.data.time);
			
			this.temphr = new Point(this.position.x, this.position.y + hrChange);
			this.tempvalhr = gr.coordsToVal(this.temphr);
			if(this.tempvalhr.y > 0) {
				this.position.y += hrChange;
	
				systext.content = this.tempvalhr.y;
				systext.position.x = this.position.x + 30;
				systext.position.y = this.position.y;
				systext.visible = true;
			}
		};
		
		hrgroup.onMouseUp = function(event) {
			systext.visible = false;
			
			gr.setHR(this.newval.y, this.data.time);
			gr.drawObs();
		};

		return hrgroup;
	};
	
	this.getCoords = function(valX, valY) {
		xpos = (valX / upiX) * xInterval;
		
		// Y axis is inverted
		ypos = gHeight - (valY / upiY) * yInterval;
		
		return new Point(xpos, ypos);
	};
	
	this.coordsToVal = function(coords) {
		xVal = Math.floor((coords.x / xInterval) * upiX);
		ypos = gHeight - coords.y;
		yVal = Math.floor((ypos / yInterval) * upiY);
		return new Point(xVal, yVal);
	};
	
	this.draw = function() {
		
		// Refresh
		// gridGroup.removeChildren();
		var l = gridGroup.children.length;
		for(var i=0; i < l; i++){
		    gridGroup.children[l].remove();
		}
		
		// Need to resize intervals?
		if(this.fitToX) {
			// xInterval = Math.floor(gWidth / ((maxX - minX) / upiX));
		}
		if(this.fitToY) {
			yInterval = Math.floor(gHeight / ((maxY - minY) / upiY));
		}
		
		gridRect = new Path.Rectangle(new Point(0,0), new Size(gWidth, gHeight));
		gridRect.strokeColor = 'black';
		gridRect.strokeWidth = 4;
		gridRect.fillColor = 'white';
		gridRect.opacity = 0;
		gridGroup.appendBottom(gridRect);
		
		// Draw Vertical lines
		lineNumber = 0;
		for(var xPos = 0; xPos <= gWidth; xPos += xInterval) {
			var gridline = new Path();
			gridline.strokeColor = 'black';
			
			gridline.strokeWidth = 1;
			if(this.boldIntervalX > 0) {
				if(lineNumber % this.boldIntervalX == 0) {
					gridline.strokeWidth = 2;
				}
			}
			
			topCoord = new Point(xPos, 0);
			botCoord = new Point(xPos, gHeight);
			
			gridline.moveTo(topCoord);
			gridline.lineTo(botCoord);
			gridGroup.appendTop(gridline);
			
			lineNumber++;
		}
		
		// Draw Horizontal lines
		lineNumber = 0;
		for(var yPos = gHeight; yPos > 0; yPos -= yInterval) {
			var gridline = new Path();
			gridline.strokeColor = 'black';
			
			gridline.strokeWidth = 1;
			if(this.boldIntervalY > 0) {
				if(lineNumber % this.boldIntervalY == 0) {
					gridline.strokeWidth = 2;
				}
			}
			
			leftCoord = new Point(0, yPos);
			rightCoord = new Point(gWidth, yPos);
			
			gridline.moveTo(leftCoord);
			gridline.lineTo(rightCoord);
			gridGroup.appendTop(gridline);
			
			lineNumber++;
		}
		
		this.drawObs();
	};
	
	gridGroup.width = this.width;
	gridGroup.height = this.height;
};

var rect = new Grid(canvasSize.width, canvasSize.height);
rect.width = canvasSize.width;
rect.height = canvasSize.height;
rect.boldIntervalX = 3;
rect.boldIntervalY = 5;
rect.setBP(120, 70, 5);
rect.setHR(150, 5);
rect.setHR(130, 10);
rect.setHR(110, 15);
rect.setHR(100, 20);
rect.setBP(123, 68, 10);
rect.setBP(125, 70, 15);
rect.setBP(130, 75, 20);
rect.fitToY = true;
rect.draw();

var rectangle = new Rectangle(new Point(100, 600), new Size(60, 60));
var cornerSize = new Size(10, 10);
buttonScaleX = new Path.Rectangle(rectangle, cornerSize);
buttonScaleX.strokeColor = 'black';
buttonScaleX.fillColor = 'blue';
buttonScaleX.onClick = function(event) {
	gridGroup.position.x = 500;
};

function drawCross(cx, cy) {
	var crosssize = 6;
	var crosspath = new Path();
	crosspath.strokeColor = 'black';
	crosspath.strokeWidth = 2;
	
	center = new Point(cx, cy);
	tlCoord = new Point(cx - crosssize, cy - crosssize);
	brCoord = new Point(cx + crosssize, cy + crosssize);
	blCoord = new Point(cx - crosssize, cy + crosssize);
	trCoord = new Point(cx + crosssize, cy - crosssize);
	
	crosspath.moveTo(tlCoord);
	crosspath.lineTo(brCoord);
	crosspath.lineTo(center);
	crosspath.lineTo(blCoord);
	crosspath.lineTo(trCoord);
	
	gridGroup.appendTop(crosspath);
}


function drawBP(syst, dias, time) {
	
	// Draw connecting line?
	var bppath = new Path();
	bppath.strokeColor = 'black';
	bppath.strokeWidth = 3;
	
	topCoord = new Point(xc, systolicY);
	btmCoord = new Point(xc, diastolicY);

	bppath.moveTo(topCoord);
	bppath.lineTo(btmCoord);
	
	
	drawHorizontalLine(xc,yc);
}



//drawGrid();
//drawBP(120,80,5);
//drawHR(56,5);

//drawBP(110,70,10);
//drawHR(67,10);

//drawBP(100,65,15);
//drawHR(80,15);

//drawBP(90,50,20);
//drawHR(100,20);

//drawBP(190,100,25);
//drawHR(60,25);