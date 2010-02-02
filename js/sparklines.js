// Setup a very simple "virtual canvas" to make drawing the few shapes we need easier
var vcanvas = function(width, height, target) {
	return this.init(width, height, target);
};

vcanvas.prototype = {
	init : function(width, height, target){
		this.width = width;
		this.height = height;
		this.target = target;
		if (target[0]) target=target[0];
		target.vcanvas = this;

		this.canvas = Ext.get('sparkline_canvas').dom;
		if (target[0]) target=target[0];
		target.vcanvas = this;
		this.canvas.style.display = 'inline-block';
		this.canvas.style.width = width;
		this.canvas.style.height = height;
		this.canvas.style.verticalAlign = 'top';
		this._insert(this.canvas, target);
		this.pixel_height = $(this.canvas).height();
		this.pixel_width = $(this.canvas).width();
		this.canvas.width = this.pixel_width;
		this.canvas.height = this.pixel_height;
		this.canvas.style.width = this.pixel_width;
		this.canvas.style.height = this.pixel_height;
		
	},

	_getContext : function(lineColor, fillColor, lineWidth) {
		var context = this.canvas.getContext('2d');
		if (lineColor != undefined)
			context.strokeStyle = lineColor;
			context.lineWidth = lineWidth==undefined ? 1 : lineWidth;
		if (fillColor != undefined)
			context.fillStyle = fillColor;
		return context;
	},

	drawShape : function(path, lineColor, fillColor, lineWidth) {
		var context = this._getContext(lineColor, fillColor, lineWidth);
		context.beginPath();
		context.moveTo(path[0][0]+0.5, path[0][1]+0.5);
		for(var i=1; i<path.length; i++) {
			context.lineTo(path[i][0]+0.5, path[i][1]+0.5); // the 0.5 offset gives us crisp pixel-width lines
		}
		if (lineColor != undefined) {
			context.stroke();
		}
		if (fillColor != undefined) {
			context.fill();
		}
	},

	drawLine : function(x1, y1, x2, y2, lineColor, lineWidth) {
		return this.drawShape([ [x1,y1], [x2,y2] ], lineColor, lineWidth);
	},

	drawCircle : function(x, y, radius, lineColor, fillColor) {
		var context = this._getContext(lineColor, fillColor);
		context.beginPath();
		context.arc(x, y, radius, 0, 2*Math.PI, false);
		if (lineColor != undefined) {
			context.stroke();
		}
		if (fillColor != undefined) {
			context.fill();
		}
	}, 

	drawPieSlice : function(x, y, radius, startAngle, endAngle, lineColor, fillColor) {
		var context = this._getContext(lineColor, fillColor);
		context.beginPath();
		context.moveTo(x, y);
		context.arc(x, y, radius, startAngle, endAngle, false);
		context.lineTo(x, y);
		context.closePath();
		if (lineColor != undefined) {
			context.stroke();
		}
		if (fillColor) {
			context.fill();
		}
	},

	drawRect : function(x, y, width, height, lineColor, fillColor) {
		return this.drawShape([ [x,y], [x+width, y], [x+width, y+height], [x, y+height], [x, y] ], lineColor, fillColor);
	},

	getElement : function() {
		return this.canvas;
	},

	_insert : function(el, target) {
		$(target).html(el);
	}

};


SparkLines = Ext.extend(Ext.BoxComponent, {

	type : 'line',
	lineColor : '#00f',
	fillColor : '#cdf',
	defaultPixelsPerValue : 3,
	width : 'auto', 
	height : 'auto',
	composite : false,

	autoEl:{
		tag: 'canvas',
		id: 'sparkline_canvas'
	},

	initComponent:function(){
		SparkLines.superclass.initComponent.call(this);

		// Get parameters passed by the user.
		this.uservalues = this.values;
	},

	line : function(values, width, height) {
		this.spotColor = this.spotColor!=undefined ? this.spotColor : '#f80' ;
		this.spotRadius = this.spotRadius!=undefined ? this.spotRadius : 1.5;
		this.minSpotColor = this.minSpotColor!=undefined ? this.minSpotColor : '#f80';
		this.maxSpotColor = this.maxSpotColor!=undefined ? this.maxSpotColor : '#f80';
		this.lineWidth= this.lineWidth!=undefined ? this.lineWidth : 1;
		this.normalRangeMin = this.normalRangeMin!=undefined ? this.normalRangeMin : undefined;
		this.normalRangeMax = this.normalRangeMax!=undefined ? this.normalRangeMax : undefined;
		this.normalRangeColor = this.normalRangeColor!=undefined ? this.normalRangeColor : '#ccc';
		this.chartRangeMin = this.chartRangeMin != undefined ? this.chartRangeMin : undefined;
		this.chartRangeMax = this.chartRangeMax != undefined ? this.chartRangeMax : undefined;			

		var xvalues = [], yvalues = [], yminmax = [];
		for (i=0; i<values.length; i++) {
		    var v = values[i];
		    var isstr = typeof(values[i])=='string';
		    var isarray = typeof(values[i])=='object' && values[i] instanceof Array;
		    var sp = isstr && values[i].split(':');
		    if (isstr && sp.length == 2) { // x:y
			xvalues.push(Number(sp[0]));
			yvalues.push(Number(sp[1]));
			yminmax.push(Number(sp[1]));
		    } else if (isarray) {
			xvalues.push(values[i][0]);
			yvalues.push(values[i][1]);
			yminmax.push(values[i][1]);
		    } else {
			xvalues.push(i);
			if (values[i]===null || values[i]=='null') {
			    yvalues.push(null);
			} else {
			    yvalues.push(Number(values[i]));
			    yminmax.push(Number(values[i]));
			}
		    }
		}
		if (this.xvalues) {
		    xvalues = this.xvalues;
		}

		var maxy = Math.max.apply(Math, yminmax);
		var maxyval = maxy;
		var miny = Math.min.apply(Math, yminmax);
		var minyval = miny;

		var maxx = Math.max.apply(Math, xvalues);
		var maxxval = maxx;
		var minx = Math.min.apply(Math, xvalues);
		var minxval = minx;

		if (this.normalRangeMin!=undefined) {
		    if (this.normalRangeMin<miny)
			miny = this.normalRangeMin;
		    if (this.normalRangeMax>maxy)
			maxy = this.normalRangeMax;
		}
		if (this.chartRangeMin!=undefined && this.chartRangeMin<miny) {
		    miny = this.chartRangeMin;
		}
		if (this.chartRangeMax!=undefined && this.chartRangeMax>maxy) {
		    maxy = this.chartRangeMax;
		}
		var rangex = maxx-minx == 0 ? 1 : maxx-minx;
		var rangey = maxy-miny == 0 ? 1 : maxy-miny;
		var vl = yvalues.length-1;

		if (vl<1) {
		    this.innerHTML = '';
		    return;
		}

		var target = new vcanvas(width, height, this.composite);

		if (target) {
			var canvas_width = target.pixel_width;
			var canvas_height = target.pixel_height;
			var canvas_top = 0;
			var canvas_left = 0;

			if (this.spotRadius && (canvas_width < (this.spotRadius*4) || canvas_height < (this.spotRadius*4))) {
				this.spotRadius = 0;
			}
			if (this.spotRadius) {
				// adjust the canvas size as required so that spots will fit
				if (this.minSpotColor || (this.spotColor && yvalues[vl]==miny)) 
				    canvas_height -= Math.ceil(this.spotRadius);
				if (this.maxSpotColor || (this.spotColor && yvalues[vl]==maxy)) {
				    canvas_height -= Math.ceil(this.spotRadius);
				    canvas_top += Math.ceil(this.spotRadius);
				}
				if (this.minSpotColor || this.maxSpotColor && (yvalues[0]==miny || yvalues[0]==maxy)) {
				    canvas_left += Math.ceil(this.spotRadius);
				    canvas_width -= Math.ceil(this.spotRadius);
				}
				if (this.spotColor || (this.minSpotColor || this.maxSpotColor && (yvalues[vl]==miny||yvalues[vl]==maxy)))
				    canvas_width -= Math.ceil(this.spotRadius);
			}
		    
			canvas_height--;
			if (this.normalRangeMin!=undefined) {
				var ytop = canvas_top+Math.round(canvas_height-(canvas_height*((this.normalRangeMax-miny)/rangey)));
				var height = Math.round((canvas_height*(this.normalRangeMax-this.normalRangeMin))/rangey);
				target.drawRect(canvas_left, ytop, canvas_width, height, undefined, this.normalRangeColor);
			}

			var path = [];
			var paths = [path];
			for(var i=0; i<yvalues.length; i++) {
				var x=xvalues[i], y=yvalues[i];
				if (y===null) {
					if (i) {
						if (yvalues[i-1]!==null) {
							path = [];
							paths.push(path);
						}
					}
				} else {
					if (!path.length) {
						// previous value was null
						path.push([canvas_left+Math.round((x-minx)*(canvas_width/rangex)), canvas_top+canvas_height]);
					}
					path.push([canvas_left+Math.round((x-minx)*(canvas_width/rangex)), canvas_top+Math.round(canvas_height-(canvas_height*((y-miny)/rangey)))]);
				}
			}
			for(var i=0; i<paths.length; i++) {
				path = paths[i];
				if (!path.length)
				    continue; // last value was null
				if (this.fillColor) {
					path.push([path[path.length-1][0], canvas_top+canvas_height-1]);
					target.drawShape(path, undefined, this.fillColor);
					path.pop();
				}
				// if there's only a single point in this path, then we want to display it as a vertical line
				// which means we keep path[0]  as is
				if (path.length>2) {
				    // else we want the first value 
				    path[0] = [ path[0][0], path[1][1] ];
				}
				target.drawShape(path, this.lineColor, undefined, this.lineWidth);
			}
			if (this.spotRadius && this.spotColor) {
				target.drawCircle(canvas_left+canvas_width,  canvas_top+Math.round(canvas_height-(canvas_height*((yvalues[vl]-miny)/rangey))), this.spotRadius, undefined, this.spotColor);
			}
			if (maxy!=minyval) {
				if (this.spotRadius && this.minSpotColor) {
					var x = xvalues[yvalues.indexOf(minyval)];
					target.drawCircle(canvas_left+Math.round((x-minx)*(canvas_width/rangex)),  canvas_top+Math.round(canvas_height-(canvas_height*((minyval-miny)/rangey))), this.spotRadius, undefined, this.minSpotColor);
				}
				if (this.spotRadius && this.maxSpotColor) {
					var x = xvalues[yvalues.indexOf(maxyval)];
					target.drawCircle(canvas_left+Math.round((x-minx)*(canvas_width/rangex)),  canvas_top+Math.round(canvas_height-(canvas_height*((maxyval-miny)/rangey))), this.spotRadius, undefined, this.maxSpotColor);
				}
				}
			} else {
				// Remove the tag contents if sparklines aren't supported
				this.innerHTML = '';
			}	
	},

	afterRender:function() {
		SparkLines.superclass.afterRender.call(this);

		var width = this.width=='auto' ? this.uservalues.length*this.defaultPixelsPerValue : this.width;
		if (this.height == 'auto') {
		    if (!this.composite) {
			height = this.getHeight();
		    }
		} else {
		    height = this.height;
		}

		if (this.type == 'line')
		{
			this.line(this.uservalues, width, height);
		}
	}
});




Ext.onReady(function(){

	var s = new SparkLines({
		values: [1,4,6,6,8,5,3,5],
		type: 'line', 	
		height: 100,
		width: 100,
		renderTo:'sparkline'	
	});


});
