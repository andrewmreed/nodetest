/* ----------------- IO: requires 2-d ctx unless providing one  ----------------- */
function rect(s, x, y, h, w, context) {
	if (!context) context = ctx;
	context.fillStyle = s;
	context.fillRect(x, y, h, w);
}

function srect(s, x, y, h, w, context) {
	if (!context) context = ctx;
	context.strokeStyle = s;
	context.strokeRect(x, y, h, w);
}

function circle (s, x, y, r, context) {
	if (!context) context = ctx;
	context.fillStyle = s;
	context.beginPath();
	context.arc(x, y, r, 2*Math.PI, 0, true); 
	context.fill();
	context.closePath();
}

function scircle (s, x, y, r, context) {
	if (!context) context = ctx;
	context.strokeStyle = s;
	context.beginPath();
	context.arc(x, y, r, 2*Math.PI, 0, true); 
	context.stroke();
	context.closePath();
}

function text(t, f, s, x, y, context) {
	if (!context) context = ctx;
	context.font = f;
	context.fillStyle = s;
	context.fillText(t, x, y);
}




// shuffle an array
function randomizeArray(a) {
	for (var i = 0; i < a.length; i++) {
		var newidx = Math.floor(Math.random() * a.length);
		var tmp = a[i];
		a[i] = a[newidx];
		a[newidx] = tmp;
	}
}

//Hash
function HashTable() {
    this.hashes = {},
    this.id = 0;
}

HashTable.prototype = {
    constructor: HashTable,

    put: function( obj, value ) {
        obj.hashTableId = this.id;
        this.hashes[ this.id ] = value;
        this.id++;
    },

    get: function( obj ) {
        return this.hashes[ obj.hashTableId ];
    }
};