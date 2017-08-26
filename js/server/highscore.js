if (typeof module != 'undefined') {
	module.exports = {
	  'getList': getList,
	  'saveScore': saveScore
	};
}

var HIGHSCORE_PATH = "highscore.txt";
var HIGHSCORE_TMP_PATH = "highscore.txt.tmp";

var list = false;

function saveScore(p1, p2, score, time, highlights) {
	if (!list) loadList();
	list.push({
		'p1':p1, 'p2':p2, 'score': score,
		'date':Date.now(), 'time':time, 'highlights':highlights
	});
	
	list.sort((a,b) => (a.score - b.score));
	
	writeListToFile();
}

function getList() {
	if (!list) loadList();
	return list;
}

function loadList() {
	var fs = require('fs');
	var data = fs.readFileSync(HIGHSCORE_PATH);
	list = JSON.parse(data);
}

function writeListToFile() {
	var fs = require('fs');
	
	var s = JSON.stringify(list);
	
	fs.closeSync(fs.openSync(HIGHSCORE_TMP_PATH, 'w'));  // touch tmp file
	fs.writeFile(HIGHSCORE_TMP_PATH, s, function(err) {
		if(err) {return console.log(err);}
		
		fs.rename(HIGHSCORE_TMP_PATH, HIGHSCORE_PATH);
	}); 
}

