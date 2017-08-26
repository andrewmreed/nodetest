var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var letterData = require('./js/server/data').getLetterData();
var isWord = require('./js/server/wordlist').isWord;
var mHighscore = require('./js/server/highscore');

var players = [];
var grid = [[],[],[],[],[],[],[]];

var spellCounter = 20;
var lastSpellTime = Date.now();

var knight, archer, wizard, sorcerer;
var gameStartTime; // not used?
var lettersPlayed;

var gamePhase = 0;
var Phases = {'LOBBY':0, 'GAME':1, 'SCORE':2};

app.use('/js', express.static(__dirname + '/js'));
app.use('/img', express.static(__dirname + '/img'));
app.use('/inc', express.static(__dirname + '/inc'));

app.get('/', function(req, res){
	res.sendfile('index.html');
});

io.on('connection', 
	function(socket){  
		if (players.length > 0) {
			socket.emit('player_joined', {'name': players[0].name});
		}
		console.log('user connected');
	
		socket.on('disconnect', function(){console.log('user disconnected');});
		
		socket.on('join', 
			function(o){
				//if (players.length >= 2) {socket.emit('error', {'message':'Too many players'}); return;}
				
				socket.emit('confirm_join', {'playerIdx' : players.length});
				socket.broadcast.emit('player_joined', {'name': o.name});
				
				players.push({'name': o.name});
				
				if (players.length == 2) {  // TODO should be 2
					console.log('starting...');
					initGame();
					io.emit('game_start', {'knight':knight, 'archer':archer, 'wizard':wizard, 'sorcerer':sorcerer, 'grid':grid});
					
					for (var p = 0; p < players.length; p++) {
						var hand = [];
						for (var i = 0; i < 5; i++) hand.push(randomLetter());
						players[p].hand = hand;
						io.emit('deal_hand', {'playerIdx' : p, 'hand' : hand});
					}
				}				
			}
		);
		
		socket.on('choose_letter', function(o) {socket.broadcast.emit('partner_chose_letter', {'idx': o.idx})});
		
		socket.on('sendHint', function(o) {socket.broadcast.emit('partner_sent_hint', o)});
		
		socket.on('play_letter', 
			function(o) {
				if (grid[o.i][o.j]) return;
				
				grid[o.i][o.j] = players[o.playerIdx].hand[o.handIdx];
				grid[o.i][o.j].playerIdx = o.playerIdx;
				
				var newTile = randomLetter();
				players[o.playerIdx].hand[o.handIdx] = newTile;
				spellCounter--;
				lettersPlayed++;
				io.emit('letter_played', {'playerIdx':o.playerIdx, 'handIdx':o.handIdx, 'i':o.i, 'j':o.j, 'tile':grid[o.i][o.j], 'newTile':newTile, 'spellCounter':spellCounter});
				
				checkWords();
				
				
				var check = spellCounter; // + ((Date.now() - lastSpellTime)/1000);
				if (check <= 0) {
					// spellCounter = 0;
					//lastSpellTime = Date.now();
					spellCounter = castSpell(); //setTimeout(castSpell, 5000);
				}
			}
		);
		
		socket.on('request_reset',  function() {resetGame(); io.emit('reset'); });
	}
);

http.listen(3000, function(){
  console.log('listening on *:3000');
});


function initGame() {
	knight = {'name':'Knight', 'attack':40};
	archer = {'name':'Archer', 'attack':40};
	wizard = {'name':'Wizard', 'attack':40};
	sorcerer = {'HP': 800, 'maxHP': 800};

	gameStartTime = new Date();
	lettersPlayed = 0;
	spellCounter = 10;
	lastSpellTime = Date.now();
	
	grid = [[],[],[],[],[],[],[]]
	for (var i = 0; i < 7; i++) for (var j = 0; j < 7; j++) grid[i][j] = false;
	
	gamePhase = Phases.GAME;
}

function resetGame() {
	players = [];
	gamePhase = Phases.LOBBY;
}


function checkWords() {
	var r = [];

	for (var i = 0; i < grid.length; i++) {
		var result = findWordInArray(grid[i]);
		if (result) {
			var lettersAffected = [];
			for (var j = result['start']; j <= result['end']; j++) {lettersAffected.push({'i':i, 'j':j});}
			r.push({'word':result['word'], 'letters':lettersAffected});
		}
	}
	
	for (var j = 0; j < grid[0].length; j++) {
		var col = [];
		for (var i = 0; i < grid.length; i++) {
			col.push(grid[i][j]);
		}
		
		result = findWordInArray(col);
		if (result) {
			var lettersAffected = [];
			for (var i = result['start']; i <= result['end']; i++) {lettersAffected.push({'i':i, 'j':j});}
			r.push({'word':result['word'], 'letters':lettersAffected});
		}
	}

	if (r.length > 0) {
		var attacks = getAttacks(r);
		
		// clear letters off the grid
		for (var a = 0; a < r.length; a++) {
			for (var b = 0; b < r[a].letters.length; b++) {
				var coord = r[a].letters[b];
				grid[coord.i][coord.j] = false;
			}
		}
		
		io.emit('words_spelled', {'grid':grid, 'wordsInfo':r});
		
		for (var i = 0; i < attacks.length; i++) {
			io.emit(attacks[i].type, attacks[i].data);
		}
		
		if (sorcerer.HP <= 0) {
			mHighscore.saveScore(players[0].name, players[1].name, lettersPlayed, 0 /*time elapsed*/, 'TODO' /*highlights*/);
			io.emit('you_win', {'lettersPlayed':lettersPlayed, 'highScores':mHighscore.getList()});
		}
	}
}


function findWordInArray(a) {
	var candidate = '';
	var startIdx = -1;
	for (var i = 0; i < a.length; i++) {
		if (!a[i] || a[i]['type'] == 'fire') { //TODO fix type=fire check to something reasonable.  maybe check type==letter or something
			if (candidate.length > 2) {
				if (isWord(candidate)) {			
					return {'word':candidate, 'start':startIdx, 'end':i - 1}; // returns after it finds the first word with no more searching.  I guess that's OK?  
					//  well, not OK.  ROTORED isn't a word :-(, but when the middle O is used, ROT and RED take two additional rounds to clear.  
				}
			}
			candidate = '';
			startIdx = -1;
		}
		else {
			candidate += a[i]['letter'];
			if (startIdx < 0) startIdx = i;
		}
	}
	
	if (candidate.length > 2) {
		if (isWord(candidate)) {
			return {'word':candidate, 'start':startIdx, 'end':a.length - 1};
		}
	}
	
	return false;
}


// takes in a result from checkWords ([{'word':'ACE', 'letters':[<coordinates>}]) and does damage calculations for it.
function getAttacks(r) {
	// KNIGHT : attacks on 5-letter word; levels up on 7
	var ret = [];
	for (var i = 0; i < r.length; i++) {
		var w = r[i];
		if (w.letters.length >= 7) {
			knight.attack += 20;
			io.emit('level_up', {'hero': 'knight', 'increase':20, 'newAttack':knight.attack});
		}
		
		if (w.letters.length >= 5) {
			var bonus = getTeamworkBonus(w.letters);
			var damage = Math.floor(knight.attack * bonus.multiplier);
			sorcerer.HP -= damage;
			ret.push({'type':'attack', 'data':
				{'hero': 'knight', 'damage': damage, 'newHP': sorcerer.HP, 'baseDamage': knight.attack, 'multiplier': bonus.multiplier, 'teamwork': bonus.teamwork, 'word':w.word}});
		}
	}
	
	// ARCHER: attacks on 10-point word; levels up on 14
	for (var i = 0; i < r.length; i++) {
		var wordPoints = 0;
		var w = r[i];
		
		for (var j = 0; j < w.letters.length; j++) {
			var coord = w.letters[j];
			console.log(grid[coord.i][coord.j]);
			wordPoints += grid[coord.i][coord.j].points;
		}

		if (wordPoints >= 14) {
			archer.attack += 20;
			io.emit('level_up', {'hero': 'archer', 'increase':20, 'newAttack':archer.attack});
		}
		if (wordPoints >= 10) {
			var bonus = getTeamworkBonus(w.letters);
			var damage = Math.floor(archer.attack * bonus.multiplier);
			sorcerer.HP -= damage;
			ret.push({'type':'attack', 'data':
				{'hero': 'archer', 'damage': damage, 'newHP': sorcerer.HP, 'baseDamage': archer.attack, 'multiplier': bonus.multiplier, 'teamwork': bonus.teamwork, 'word':w.word}});
		}
	}
		
	//WIZARD: attacks when 7 total letters used; levels up on 9
	if (r.length > 1) {
		var allLetters = [];
		for (var i = 0; i < r.length; i++) {
			for (var j = 0; j < r[i].letters.length; j++) {
				allLetters.push(r[i].letters[j]);
			}
		}
		
		if (allLetters.length >= 9) {
			wizard.attack += 20;
			io.emit('level_up', {'hero': 'wizard', 'increase':20, 'newAttack':wizard.attack});
		}
		
		if (allLetters.length >= 7) {
			var bonus = getTeamworkBonus(allLetters);
			var damage = Math.floor(wizard.attack * bonus.multiplier);
			sorcerer.HP -= damage;
			ret.push({'type':'attack', 'data':
				{'hero': 'wizard', 'damage': damage, 'newHP': sorcerer.HP, 'baseDamage': wizard.attack, 'multiplier': bonus.multiplier, 'teamwork': bonus.teamwork, 'word':r[0].word + '/' + r[1].word}});		
		}
	}
	
	return ret;
}

function getTeamworkBonus(letters) {
	lettersContributed = [0, 0];
	
	for (var i = 0; i < letters.length; i++) {
		var l = letters[i];
		if (grid[l.i][l.j].playerIdx >= 0) lettersContributed[grid[l.i][l.j].playerIdx]++;
	}
	
	if (lettersContributed[0] >= 3 && lettersContributed[1] >= 3) return {'teamwork' : 3, 'multiplier' : 2};
	if (lettersContributed[0] >= 2 && lettersContributed[1] >= 2) return {'teamwork' : 2, 'multiplier' : 1.5};
	if (lettersContributed[0] >= 1 && lettersContributed[1] >= 1) return {'teamwork' : 1, 'multiplier' : 1};
	return {'teamwork'  : 0, 'multiplier' : 0.6};
}

function randomLetter() {
	var totalWeight = 89; // I counted.
	var roll = Math.floor(Math.random() * totalWeight);
	
	for (key in letterData) {
		var l = letterData[key]
		roll -= l.weight;
		if (roll < 0) return {'letter' : key, 'points' : l.points};
	}
}

function castSpell() {
	return (arand(spellFunctions))(); 
}


// rare, medium, common.  used in clone and 
var letterRarityGroups = [
	['J', 'K', 'Q', 'V', 'W', 'X', 'Z', 'Y'], 
	['B', 'C', 'D', 'F', 'G', 'H', 'M', 'P', 'U'], 
	['A', 'E', 'I', 'L', 'N', 'O', 'R', 'S', 'T']
]

// returns the number of plays before the next spell is cast
var spellFunctions = [
	// CLONE
	function() {
		var playerIdx = Math.floor(Math.random() * players.length);
		var i = Math.floor(Math.random() * 3);
		var count = (i == 0 ? 3 : i == 1 ? 4 : 5);
		var letters = letterRarityGroups[i];
		var letter = arand(letters);
		
		for (var j = 0; j < count; j++) {players[playerIdx].hand[j] = {'letter': letter, 'points': letterData[letter].points}};
				
		io.emit('spell_cast', {'spell':'CLONE', 'playerIdx':playerIdx, 'letter':letter, 'hand':players[playerIdx].hand});
		
		return 20;
	} ,
	
	/*,'FREEZE' : function() {
	
	
	},*/
	// HAIL (6 random letters plop down)
	function() {
		var spaces = findOpenGridSpaces(6);
		if (spaces.length < 6) return;
		
		for (var k = 0; k < 6; k++) {
			var s = spaces[k];
			var l = arand(letterRarityGroups[k % 3]);
			grid[s.i][s.j] = {'playerIdx':-1, 'letter':l, 'points':letterData[l].points};
		}
		
		io.emit('spell_cast', {'spell':'HAIL', 'grid': grid});
		
		return 20;
	},
	
	// QUAKE (4 letters move)
	function() {
		var letterCoords = findPlacedLetters(4);
		var spaces = findOpenGridSpaces(4);
		
		var count = Math.min(letterCoords.length, spaces.length);
		
		for (var k = 0; k < count; k++) {
			var l = letterCoords[k];
			var s = spaces[k];
			
			grid[s.i][s.j] = grid[l.i][l.j];
			grid[l.i][l.j] = false;
		}
		
		io.emit('spell_cast', {'spell':'QUAKE', 'grid': grid});
		
		return 20;
	}/*, 
	
	function () {
		var spaces = findOpenGridSpaces(8);
		for (var k = 0; k < spaces.length; k++) {
			var s = spaces[k];
			grid[s.i][s.j] = {'type':'fire'};
		}
	}*/
];



/* **********************************
	UTIL FUNCTIONS
    ********************************* */
function findOpenGridSpaces(count) {  //ffs fix this right.
	var loopCheck = 0;
	var ret = [];
	var sret = [];
	while (loopCheck < 1000 && ret.length < count) {
		var i = Math.floor(Math.random() * 7);
		var j = Math.floor(Math.random() * 7);
		var s = i + ',' + j;
		if (!grid[i][j] && sret.indexOf(s) < 0) {
			ret.push({'i':i, 'j':j});
			sret.push(s);
		}
		loopCheck++;	
	}
	return ret;
}

function findPlacedLetters(count) {
	var l = [];
	for (var j = 0; j < grid.length; j++) {
		for (var i = 0; i < grid[j].length; i++) {
			if (grid[i][j] && grid[i][j].letter) {
				l.push({'i':i, 'j':j});
			}
		}
	}
	
	shuffle(l);
	
	if  (l.length <= count) return l;
	
	return l.slice(0, count);
}

//random element of array
function arand(a) {
	return a[Math.floor(Math.random() * a.length)];
}

function shuffle(a) {
	for (var i = 0; i < a.length; i++) {
		var j = Math.floor(Math.random() * a.length);
		var t = a[i];
		a[i] = a[j];
		a[j] = t;
	}
}