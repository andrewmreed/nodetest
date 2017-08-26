var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame  || function( callback ){window.setTimeout(callback, 1000 / 30,  Date.now());};

var DURATION_FACTOR = 1;

var animations = {
	'arena': [],
	'grid': []
}

function pse(percent, start, end) {
	return start + (end - start) * percent;
}

function animate(channel, o) {
	animations[channel].push(o);

	if (animationExists()) {
		requestAnimationFrame(animRender);
	}
}

function animationExists() {
	for (var channel in animations) {
		if (animations[channel].length > 0) return true;
	}
	return false;
}

function animRender(timeStamp) {
	render();
	
	for (var channel in animations) {
		if (animations[channel].length > 0) {
			var a = animations[channel][0];
			
			if (a.startStamp == 0) a.startStamp = timeStamp;
			
			if (timeStamp >= a.startStamp) {
				a.go(timeStamp);
			}
			/*else {
				console.log(timeStamp, animations[i].startStamp);
			}*/
		}
		
		for (var i = animations[channel].length - 1; i >= 0; i--) {
			if (animations[channel][i].done) animations[channel].splice(i, 1);
		}
	}
	if (animationExists()) {
		requestAnimationFrame(animRender);
	}
	else {
		render();
	}
}

function animateKnightAttack(o, callback) {
	animate('arena', {
		sx:LO.knight.x, sy:LO.knight.y, ex:LO.sorcerer.x + 128 , ey:LO.sorcerer.y + 64 /*knight is short */, cb:callback,
		'duration':700 * DURATION_FACTOR, 'startStamp':0, 
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				heroes['knight'].isAnimated = false;
				this.done = true;
				if (this.cb) this.cb();
				return;
			}
			
			heroes['knight'].isAnimated = true;
			
			var p = (timeStamp - this.startStamp) / this.duration;
			if (p < 0.45) {
				var P = p / 0.45;
				this.x = this.sx + (this.ex - this.sx) * P;
				this.y = this.sy + (this.ey - this.sy) * P - 70 * Math.sin(P * Math.PI);
			}
			else if (p < 0.6) {
				this.x = this.ex;
				this.y = this.ey;
			}
			else {
				//sorcerer.displayHP = o.newHP;
				var P = (p - 0.6) / 0.4;
				this.x = this.ex + (this.sx - this.ex) * P;
				this.y = this.ey + (this.sy - this.ey) * P - 40 * Math.sin(P * Math.PI);
				//text(o.damage, '24pt Tahoma', '#C00', 625 + 20 * p, 40 - 40*p);
			}
			
			ctx.drawImage(images['knight'], this.x, this.y);
		}
	});
}

function animateArcherAttack(o, callback) {
	animate('arena', {
		'duration':500 * DURATION_FACTOR, 'startStamp':0, cb:callback, 'asx':LO.archer.x + 20, 'aex':LO.sorcerer.r, 'asy':LO.archer.y - 12 + 64, 'aey':LO.sorcerer.y + 96,
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				heroes['archer'].isAnimated = false;
				this.done = true;
				if (this.cb) this.cb();
				return;
			}
			
			heroes['archer'].isAnimated = true;
			
			var p = (timeStamp - this.startStamp) / this.duration;
			if (p < 0.4) {
				var P = p / 0.4;
				ctx.drawImage(images['archer'], LO.archer.x + 20 * P, LO.archer.y - 12 * P);
			}
			else {
				if (p < 0.9) {
					var P = (p - 0.4) / 0.5;
					ctx.drawImage(images['arrow'], pse(P, this.asx, this.aex), pse(P, this.asy, this.aey));
					ctx.drawImage(images['archer'], LO.archer.x + 20, LO.archer.y - 12);
				}
				else {
					var P = (p - 0.9) / 0.1;
					ctx.drawImage(images['archer'], LO.archer.x + 20 * (1-P), LO.archer.y - 12 * (1-P));
				}
				//if (p > 0.5) text(o.damage, '24pt Tahoma', '#C00', 625 + 20 * p, 40 - 40*p);
			}			
		}
	});
}

function animateWizardAttack(o, callback) {
	animate('arena', {
		'asx':LO.wizard.x + 20, 'aex':LO.sorcerer.r, 'asy':LO.wizard.y + 32, 'aey':LO.sorcerer.y + 96,
		'duration':500 * DURATION_FACTOR, 'startStamp':0, cb:callback,
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				heroes['wizard'].isAnimated = false;
				this.done = true;
				if (this.cb) this.cb();
				return;
			}
			
			heroes['wizard'].isAnimated = true;
			
			var p = (timeStamp - this.startStamp) / this.duration;
			if (p < 0.6) {
				ctx.drawImage(images['wizard'], LO.wizard.x + 10 * (Math.random() - 0.5), LO.wizard.y);
			}
			else {		
				P = (p - 0.6) / 0.4;
				ctx.drawImage(images['fireball'], pse(P, this.asx, this.aex), pse(P, this.asy, this.aey));
				ctx.drawImage(images['wizard'], LO.wizard.x, LO.wizard.y);
			}	
			//if (p > 0.5) text(o.damage, '24pt Tahoma', '#C00', 625 + 20 * p, 40 - 40*p);			
		}
	});
}

function animateLevelUp(heroName, callback) {
	animate('arena', {
		'sx':LO[heroName].x, 'sy':LO[heroName].y, 'heroName':heroName,
		'duration':500 * DURATION_FACTOR, 'startStamp':0, cb:callback,
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				heroes[this.heroName].isAnimated = false;
				this.done = true;
				if (this.cb) this.cb();
				return;
			}
			
			heroes[this.heroName].isAnimated = true;
			
			var p = (timeStamp - this.startStamp) / this.duration;
			var size = Math.floor(p < 0.5 ? 128 * (1 + p) : 128 * (1 + (1-p)));
			var x = this.sx - (size - 128)/2;
			var y = this.sy - (size - 128)/2;			
			
			circle ('rgba(255, 255, 150, 0.2)', this.sx + 64, this.sy + 64, 120);
			circle ('rgba(255, 255, 150, 0.2)', this.sx + 64, this.sy + 64, 100);
			ctx.drawImage(images[this.heroName], x, y, size, size);			
			text('Power up!', '20pt PressStart', '#900', this.sx - 12, this.sy - 16 - 48 * p);
		}
	});
}



function animateSorcererDeath(callBack) {
	animate('arena', {
		// ctx.drawImage(images['sorcerer'], 575, 20);
		sx:615, sy:500, cb: callBack,
		'duration':3000 * DURATION_FACTOR, 'startStamp':0, 
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				sorcerer.isAnimated = false;
				this.done = true;
				if (this.cb) this.cb();
				return;
			}
			
			sorcerer.isAnimated = true;
			
			var p = (timeStamp - this.startStamp) / this.duration * 6;
			if (Math.floor(p) % 2 == 0) {
				ctx.drawImage(images['sorcerer'], 575, 20);
			}
			else {		
				ctx.drawImage(images['sorcerer_dying'], 575, 20);
			}			
		}
	});
}

function animateSorcererCast(data, callBack) {
	// this is roughly where the tip of his staff is.
	var SX = LO.sorcerer.x + 112;
	var SY = LO.sorcerer.y + 32; 
	var EY = LO.sorcerer.y - 56;
	
	var word = data.spell;
	
	var letters = [];
	for (var i = 0; i < word.length; i++) {
		letters.push({'letter':word[i], 'endX': 8 + 52 * i, 'startP':0.2 + (0.3 * i)/word.length, 'size':0});
	}
	animate('arena', {
		cb: callBack,
		'duration':1500 * DURATION_FACTOR, 'startStamp':0, 'letters':letters, 'data':data,
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				sorcerer.isAnimated = false;
				this.done = true;
				if (this.cb) this.cb(this.data);
				return;
			}
			
			sorcerer.isAnimated = true;
			
			ctx.drawImage(images['sorcerer_spell'], LO.sorcerer.x, LO.sorcerer.y);
			
			var p = (timeStamp - this.startStamp) / this.duration;
			
			for (var i = 0; i < this.letters.length; i++) {
				var l = this.letters[i];
				
				if (l.letter != ' ') {
					if (p > l.startP) {
						if (p > l.startP + 0.3) {
							ctx.drawImage(smallTiles[l.letter], l.endX, EY);
						}
						else {
							var P = (p - l.startP) / 0.3;
							var size = Math.floor(48 * P);
							ctx.drawImage(smallTiles[l.letter], pse(P, SX, l.endX), pse(P, SY, EY), size, size);
						}
					}
				}
			}
		}
	});
}



function animatePlayLetter(data, callback) {
	grid[data.i][data.j].isAnimated = true;
	
	var isMe = (playerIdx == data.playerIdx);
	var startX = (isMe ? LO.hand.x + LO.hand.off * data.handIdx : LO.oHand.x + LO.oHand.off * data.handIdx);
	var startY = (isMe ? LO.hand.y : LO.oHand.y);
	var size = (isMe ? LO.ts : LO.sts);
	animate('grid', {
		'sx':startX, 'sy':startY, 
		'ex': LO.grid.x + LO.ts*data.i, 'ey': LO.grid.y + LO.ts*data.j, 'tile':data.tile, 'i':data.i, 'j':data.j, 'startSize':size,
		'duration':200 * DURATION_FACTOR, 'startStamp':0, playerIdx: data.playerIdx, cb:callback,
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				grid[this.i][this.j].isAnimated = false;
				this.done = true;
				if (this.cb) this.cb();
				return;
			}
			
			grid[this.i][this.j].isAnimated = true;
			
			var p = (timeStamp - this.startStamp) / this.duration;
			var x = this.sx + p*(this.ex - this.sx);
			var y = this.sy + p*(this.ey - this.sy);
			var size = LO.ts - (1 - p) * (LO.ts - this.startSize)
			ctx.drawImage(tiles[this.tile.letter], x, y, size, size);
			rect(playerColor(this.playerIdx), x, y, size, size);	
		}
	});
}

function animateWords(o, callback) {
	var squares = [];
	for(var i = 0; i < o.wordsInfo.length; i++) {
		var w = o.wordsInfo[i];
		for (var l in w.letters) {
			squares.push({'i':w.letters[l].i, 'j':w.letters[l].j, 'tile':grid[w.letters[l].i][w.letters[l].j]});
		}
	}
	
	animate('grid', {
		'squares':squares, 
		'duration':1200 * DURATION_FACTOR, 'startStamp':0, 'data': o, cb: callback,
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				for (t in this.squares) {if (grid[this.squares[t].i][this.squares[t].j]) grid[this.squares[t].i][this.squares[t].j].isAnimated = false;}
				this.done = true;
				if (this.cb) this.cb(this.data);
				return;
			}
			
			for (t in this.squares) {if (grid[this.squares[t].i][this.squares[t].j]) grid[this.squares[t].i][this.squares[t].j].isAnimated = true;}
									
			var p = (timeStamp - this.startStamp) / this.duration;
			var size = Math.floor(LO.ts * (1-p));
			
			for (t in this.squares) {
				var x = LO.grid.x + LO.ts * this.squares[t].i + (LO.ts - size)/2;
				var y = LO.grid.y + LO.ts * this.squares[t].j + (LO.ts - size)/2;
				ctx.drawImage(tiles[this.squares[t].tile.letter], x, y, size, size);
				rect(playerColor(this.squares[t].tile.playerIdx), x, y, size, size);	
			}
		}
	});
}

function animateSpeech(o, callback) {
	var qc = getQuoteCanvas(o.text, {pointRight:true});
	animate('arena', {
		'duration':5000 * DURATION_FACTOR, 'startStamp':0, 'canvas':qc, cb: callback, 'x': o.x, 'y':o.y,
		go: function(timeStamp) {
			if (timeStamp > this.startStamp + this.duration) {
				this.done = true;
				if (this.cb) this.cb(this.data);
				return;
			}
			ctx.drawImage(this.canvas, this.x, this.y);
		}
	});
}

function fillWrappedText(context, text, x, y, maxWidth, lineHeight) {
	//assume top baseline
	var words = text.split(' ');
	var line = '';
	var biggestWidth = 0;

	for(var n = 0; n < words.length; n++) {
		var testLine = line + words[n] + ' ';
		var metrics = context.measureText(testLine);
		var testWidth = metrics.width;
		if (testWidth > maxWidth && n > 0) {
			console.log('Finished line: ', line);
			context.fillText(line, x, y);
			y += lineHeight;
			line = words[n] + ' ';
		}
		else {
			
			line = testLine;
			if (testWidth > biggestWidth) biggestWidth = testWidth;
		}
	}
	console.log('Last line: ', line);
	context.fillText(line, x, y);
	y += lineHeight;
	
	return {'width':biggestWidth, 'height':y};
}
		
var typesetCanvas, typesetCtx; 
						
function getQuoteCanvas(s, o) {
	var lo = LO.quote;
	var _quote_canvas;
	
	if (!typesetCanvas) {
		typesetCanvas = document.createElement('canvas');
		typesetCanvas.width  = 500;
		typesetCanvas.height = 500;	
		typesetCtx = typesetCanvas.getContext('2d');	
	}
			
	_quote_canvas = document.createElement('canvas');
	_quote_canvas.width  = 500;
	_quote_canvas.height = 500;
	
	var _quote_ctx = _quote_canvas.getContext('2d');
	
	typesetCtx.font = (o && o.font ? o.font : '16px PressStart');
	typesetCtx.fillStyle = (o && o.fillStyle ? o.fillStyle : 'black');
	typesetCtx.textBaseline = 'top';
	
	var pointLeft = (o && o.pointRight ? false : true);
	var lineHeight = (o && o.lineHeight ? o.lineHeight : 20);
	// TODO maybe replace the 220 with something based on the size of the sentence.
	var ret = fillWrappedText(typesetCtx, s, 0, 0, 220, lineHeight);

	_quote_ctx.drawImage(images['quote-line-t'], lo.bw, 0, ret.width, lo.bh);
	_quote_ctx.drawImage(images['quote-line-b'], lo.bw, ret.height+lo.bh, ret.width, lo.bh);
	_quote_ctx.drawImage(images['quote-line-l'], 0, lo.bh, lo.bw, ret.height);
	_quote_ctx.drawImage(images['quote-line-r'], ret.width+lo.bw, lo.bh, lo.bw, ret.height);
	_quote_ctx.drawImage(images['quote-ul'], 0, 0);
	_quote_ctx.drawImage(images['quote-ur'], ret.width+lo.bw, 0);
	_quote_ctx.drawImage(images['quote-ll'], 0, ret.height+lo.bh);
	_quote_ctx.drawImage(images['quote-lr'], ret.width+lo.bw, ret.height+lo.bh);
	
	_quote_ctx.fillStyle = 'white';
	_quote_ctx.fillRect(lo.bw,lo.bh,ret.width,ret.height);
	
	if (pointLeft) {
		_quote_ctx.drawImage(images['quote-triangle-l'], lo.tol, ret.height+2*lo.bh-4);  // -4 is to make the (4px width) line overlap
	}
	else {
		_quote_ctx.drawImage(images['quote-triangle-r'], ret.width+lo.bw-lo.tor-lo.tw, ret.height+2*lo.bh-4);  
	}
	
	_quote_ctx.drawImage(typesetCanvas, lo.bw, lo.bh);
	
	ctx.drawImage(_quote_canvas, 0, 0);
	
	return _quote_canvas;
}
		
		