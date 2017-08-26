function setup() {
	canvas = document.getElementById('oCanvas');
	ctx = canvas.getContext('2d');
			
	loadImages(init);
}

function loadImages(callback) {
	var loadedImages = 0;
	var numImages = imageList.length;
	
	for(var i = 0; i < imageList.length; i++) {
		var name = imageList[i];
		images[name] = new Image();
		images[name].onload = function() {
			if(++loadedImages >= numImages) {
				callback();
			}
		};
		images[name].src = 'img/' + name + '.png';
	}
}

function init() {
	initIO();
	canvas.addEventListener('mousedown', handleClick, false);
	addEventListener('keypress', handleKeyPress, false);
	showScreen('lobby');
}

function startGame(o) {
	grid = o.grid;
	
	knight = o.knight; 
	archer = o.archer; 
	wizard = o.wizard; 
	
	knight['attackAnimation']  = animateKnightAttack;
	archer['attackAnimation']  = animateArcherAttack;
	wizard['attackAnimation']  = animateWizardAttack;
	
	heroes = {'knight':knight, 'archer':archer, 'wizard':wizard};
	
	sorcerer = o.sorcerer;
	sorcerer['displayHP'] = sorcerer.HP; 
	
	gameLog = [];
	
	startGameIO();
}

function showScreen(s) {
	console.log('Showscreen', s);
	$('#divLobby').toggle(s == 'lobby');
	$('#divGame').toggle(s == 'game');
	$('#divGameOver').toggle(s == 'game_over');
}

function playLetter(i, j) {
	if (handSelectedIdx < 0) return;
	if (grid[i][j]) return;

	socket.emit('play_letter', {'playerIdx':playerIdx, 'handIdx':handSelectedIdx, 'i':i, 'j':j});
}

function sendHint(h) {
	socket.emit('sendHint', h);
}


// taking events out of the gameEvents queue
function processGameEvents() {
	for (channel in gameEvents) {
		while (
			gameEvents[channel].list.length > 0 && 
			!gameEvents[channel].isBlocked && 
			!(gameEvents[channel].currentlyProcessing > 0 && gameEvents[channel].list[0].isBlocking)) 
		{
			var ge = gameEvents[channel].list[0];
			
			if (ge.isBlocking) gameEvents[channel].isBlocked = true;
	
			gameEvents[channel].list.shift();
			gameEvents[channel].currentlyProcessing++;
	
			gameEventHandlers[ge.type](ge.data);
		}
	}
}


var gameEventHandlers = {
	// grid type events
	'letter_played':function(o) {
		console.log(o);
		spellCounter = o.spellCounter;
		grid[o.i][o.j] = o.tile;
			
		if (o.playerIdx == playerIdx) {
			hand[o.handIdx] = o.newTile;
			handSelectedIdx = -1;
		}
		else {
			otherHand[o.handIdx] = o.newTile;
			otherHandSelectedIdx = -1;
		}
		animatePlayLetter(o, finishGridEvent);
	}, 
	
	'words_spelled':function(o) {
		animateWords(o, function() {grid = o.grid; finishGridEvent();});
		render();
	},
	
	'words_spelled':function(o) {
		animateWords(o, function() {grid = o.grid; finishGridEvent();});
		render();
	},
	
	'partner_sent_hint':function(o) {
		var s = 'How about ';
		for (var i = 0; i < o.letters.length; i++) {
			s += o.letters[i];
		}
		animateSpeech({text:s, x:400, y:300}, function() {grid = o.grid; finishArenaEvent();}); // coords should be moved to graphics; pass in hero name instead.
	},
	
	// arena events
	'attack': function(o) {
		o.type = 'attack';
		gameLog.push(o);
		sorcerer.HP = o.newHP;
		heroes[o.hero].attackAnimation(o, finishArenaEvent);
	},
	
	'level_up': function(o) {
		o.type = 'level_up';
		gameLog.push(o);
		finishArenaEvent();
	},
	
	'spell_cast':function(o) {
		animateSorcererCast(o, function(data) {handleSpellCast(data); finishGridEvent();});
	}
}

function finishGridEvent() {
	gameEvents['grid'].currentlyProcessing--;
	gameEvents['grid'].isBlocked = false;
	processGameEvents();
}

function finishArenaEvent() {
	gameEvents['arena'].currentlyProcessing--;
	gameEvents['arena'].isBlocked = false;
	processGameEvents();
}

function handleSpellCast(o) {
	console.log(o.spell + ' is cast!');
	switch (o.spell) {
		case 'CLONE':
			if (o.playerIdx == playerIdx) hand = o.hand;
			else otherHand = o.hand;
			break;
		case 'HAIL':
		case 'QUAKE':
			grid = o.grid;
			break;
	}
}

