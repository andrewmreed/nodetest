var tiles = {}, smallTiles = {};

var hint = {
	activated:false,
	hero:'',
	letters:[],
	squares:[]
}

var LO = {
	knight : {'x':648, 'y':312, 'h':128, 'w':128},
	archer : {'x':648, 'y':464, 'h':128, 'w':128},
	wizard : {'x':648, 'y':160, 'h':128, 'w':128},
	
	sorcerer : {'x':16, 'y':300, 'r':144, 'w':128, 
		'hpbar': {'x':16, 'y':268, 'w':128, 'h':40}
	},
	
	hand : {'x':224, 'y':68, 'off':68, 'r':560, 'b':136},
	oHand : {'x':264, 'y':8, 'off':52, 'r':524, 'b':60}, 
	grid : {'x':168, 'y':144, 'r':612, 'b':592},
	
	log : {'x':800, 'y':0, 'w':200, 'h':50},

	ts : 64, sts : 48, // tiles size, small tile size
	
	quote: {
		'bw':20, 'bh':20, // border image dimensions
		'tw':76, 'th':68, 'tol':12, 'tor':12 // speech triangle thing
	}
		
}

function handleClick(e) {	
	var x;
	var y;
	if (e.pageX || e.pageY) { 
		x = e.pageX;
		y = e.pageY;
	}
	else { 
		x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
	} 
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;
	
	if (x >= LO.grid.x && x <= LO.grid.r && y >= LO.grid.y && y <= LO.grid.b) {
		var i = Math.floor((x - LO.grid.x)/LO.ts);
		var j = Math.floor((y - LO.grid.y)/LO.ts);
		if (hint.activated) {
			hint.squares.push({'i':i,'j':j});
		}
		else{ 
			playLetter(i, j);		
		}
	}
	
	if (x >= LO.hand.x && x <= LO.hand.r && y >= LO.hand.y && y <= LO.hand.b) {
		handSelectedIdx = Math.floor((x - LO.hand.x) / LO.hand.off);
		socket.emit('choose_letter', {'idx' : handSelectedIdx});
		render();
	}
	
	if (hint.activated && x >= LO.oHand.x && x <= LO.oHand.r && y >= LO.oHand.y && y <= LO.oHand.b) {
		hintLetterIdx = Math.floor((x - LO.oHand.x) / LO.oHand.off);
		hint.letters.push(otherHand[hintLetterIdx].letter);
	}
	
	if (x >= LO.knight.x && x <= LO.knight.x + LO.knight.w && y > LO.knight.y && y < LO.knight.y + LO.knight.h) {
		if (hint.activated) {
			sendHint(hint);
			hint.activated = false;
		}
		else {
			activateHintMode('knight');
		}
	}
}

function handleKeyPress(event) {
	var k = String.fromCharCode(event.charCode).toUpperCase();
	
	if (k == 'E') {
		
	}
}
	
function activateHintMode(hero) {
	hint = {
	activated:true,
	hero:hero,
	letters:[],
	squares:[]
}
}

function render() {
	ctx.clearRect(0,0,800,600);
	
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	
	ctx.drawImage(images['background'], 0,0);
	
	// my hand
	for (var i = 0; i < hand.length; i++) {
		if (i == handSelectedIdx) {
			rect('#990', LO.hand.x - 4 + LO.hand.off*i, LO.hand.y - 4, LO.ts + 8, LO.ts + 8);
		}
		
		ctx.drawImage(tiles[hand[i].letter], LO.hand.x + LO.hand.off*i, LO.hand.y, LO.ts, LO.ts);	
		rect(playerColor(playerIdx), LO.hand.x + LO.hand.off*i, LO.hand.y, LO.ts, LO.ts);	
	}
	
	// their hand 
	for (var i = 0; i < otherHand.length; i++) {
		if (i == otherHandSelectedIdx) {
			rect('#990', LO.oHand.x - 4 + LO.oHand.off*i, LO.oHand.y - 4, LO.sts + 8, LO.sts + 8);
		}
		ctx.drawImage(smallTiles[otherHand[i].letter], LO.oHand.x + LO.oHand.off * i, LO.oHand.y, LO.sts, LO.sts);	
		rect(playerColor((playerIdx + 1) % 2), LO.oHand.x + LO.oHand.off * i, LO.oHand.y, LO.sts, LO.sts);		
	}
	
	// grid
	for (var i = 0; i < grid.length; i++) {
		for (var j = 0; j < grid[i].length; j++) {
			if (grid[i][j] && !grid[i][j].isAnimated) {
				var t = grid[i][j];
				if (t.type == 'fire') {
					drawTileInGrid(images['fire'], i, j);					
				}
				else {
					drawTileInGrid(tiles[t.letter], i, j);
					rect(playerColor(t.playerIdx), LO.grid.x + LO.ts*i +4, LO.grid.y + LO.ts*j +4, LO.ts - 8, LO.ts - 8);
				}
			}
		}
	}
	
	// heroes
	if (!knight.isAnimated) ctx.drawImage(images['knight'], LO.knight.x, LO.knight.y);
	if (!archer.isAnimated) ctx.drawImage(images['archer'], LO.archer.x, LO.archer.y);
	if (!wizard.isAnimated) ctx.drawImage(images['wizard'], LO.wizard.x, LO.wizard.y);
	
	//sorcerer
	if (!sorcerer.isAnimated) {
		if (spellCounter > 5 || spellCounter == 0)
			ctx.drawImage(images['sorcerer'], LO.sorcerer.x, LO.sorcerer.y);
		else
			ctx.drawImage(images['sorcerer_chantbase'], LO.sorcerer.x, LO.sorcerer.y);
	}
	rect('#111', LO.sorcerer.hpbar.x, LO.sorcerer.hpbar.y, LO.sorcerer.hpbar.w, LO.sorcerer.hpbar.h);
	rect('#CCC', LO.sorcerer.hpbar.x+4, LO.sorcerer.hpbar.y+4, LO.sorcerer.hpbar.w-8, LO.sorcerer.hpbar.h-8);
	rect('#900', LO.sorcerer.hpbar.x+8, LO.sorcerer.hpbar.y+8, LO.sorcerer.hpbar.w-16, LO.sorcerer.hpbar.h-16);
	rect('#090', LO.sorcerer.hpbar.x+8, LO.sorcerer.hpbar.y+8,  Math.max(0, (sorcerer.HP / sorcerer.maxHP)) * (LO.sorcerer.hpbar.w-16), LO.sorcerer.hpbar.h-16);
	text(Math.max(sorcerer.HP, 0) + '/' + sorcerer.maxHP, '12pt PressStart', '#DDD', LO.sorcerer.hpbar.x + (LO.sorcerer.w/2), LO.sorcerer.hpbar.y+20);
	
	// log
	for (var i = 0; i < gameLog.length && i < 10; i++) {
		var o = gameLog[gameLog.length - 1 - i];
		var y = LO.log.y + (i * LO.log.h);
		rect((o.hero == 'knight' ? '#FBB' : o.hero == 'archer' ? '#BFB' : '#DBF'), 
			LO.log.x, y, LO.log.w, LO.log.h);
		srect('#333', LO.log.x, y, LO.log.w, LO.log.h);
		if (o.type == 'attack') {		
			text(o.word, '12pt PressStart', '#333', LO.log.x + LO.log.w/2, y + LO.log.h/4);
			text((o.multiplier == 1 ? o.damage : o.baseDamage + ' x ' + (o.multiplier == 0.5 ? '½' : o.multiplier) + ' = ' + o.damage), 
				'10pt PressStart', '#300', LO.log.x + LO.log.w/2, y + 3 * LO.log.h/4);
		}
		else if (o.type == 'level_up') {
			text('LEVEL UP!', '12pt PressStart', '#960', LO.log.x + LO.log.w/2, y + LO.log.h/4);
			text((o.hero + ' ATK:' + o.newAttack).toUpperCase(), '10pt PressStart', '#303', LO.log.x + LO.log.w/2, y + 3 * LO.log.h/4);
		}
	}
}

function drawTileInGrid(img, i, j) {
	ctx.drawImage(img, LO.grid.x + LO.ts*i, LO.grid.y + LO.ts*j, LO.ts, LO.ts);
}

function playerColor(pIdx) {
	return (
		  pIdx == 0 ? 'rgba(255, 0, 0, 0.2)' 
		: pIdx == 1 ? 'rgba(0, 255, 0, 0.2)' 
		: 'rgba(50, 50, 50, 0.2)');
}

//called when page loads, after images have loaded
function initIO() {
	// nothing now
}

function createTileCanvas(letter, points, size) {
	var side, font, pointsFont, pointsOffset, baseImg;
	if (size == 'small') {
		side = 48;
		font = '20pt PressStart';
		pointsFont = '6pt PressStart';
		pointsOffset = 6;
		baseImg = 'tile_base_48';
	}
	else {
		side = 64; 
		font = '30pt PressStart';
		pointsFont = '8pt PressStart';
		pointsOffset = 6;
		baseImg = 'tile_base_64';
	}
	
	var m_canvas = document.createElement('canvas');
	m_canvas.width = side;
	m_canvas.height = side;
	var m_ctx = m_canvas.getContext('2d');
	
	m_ctx.drawImage(images[baseImg], 0, 0, side, side);
	
	m_ctx.textBaseline = 'middle';
	m_ctx.textAlign = 'center';
	text(letter, font, 'black', side / 2, side / 2, m_ctx);
	
	m_ctx.textBaseline = 'bottom';
	m_ctx.textAlign = 'right';
	text(points, pointsFont, 'black', side - pointsOffset, side - pointsOffset, m_ctx);
		
	return m_canvas;
}

// called when game is beginning, after getting inital game data from server
function startGameIO() {
	console.log("START GAME");
	for (var k in letterData) {
		tiles[k] = createTileCanvas(k, letterData[k].points);
		smallTiles[k] = createTileCanvas(k, letterData[k].points, 'small');
	}
}