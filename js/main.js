window.devicePixelRatio = 1;

var FontFaceObserver = require('fontfaceobserver');
var tinycolor = require('tinycolor2');

var WHITE = tinycolor('white');

var canvas = document.querySelector('.background');
var ctx = canvas.getContext('2d');

var da = document.createElement('canvas');
var daCtx = da.getContext('2d');

var sections = [ ...document.querySelectorAll('section') ]
var colors = sections.map( el => ({
	background: tinycolor( el.dataset.background ),
	foreground: tinycolor( el.dataset.foreground )
}));

var arrow = document.querySelector('.arrow');

var clamp = ( x, min, max ) => Math.min( Math.max( x, min ), max );
var lerp = ( a, b, t ) => a + ( b - a ) * t;
var lerpColor = ( c1, c2, t ) => {
	var rgb1 = c1.toRgb();
	var rgb2 = c2.toRgb();
	return tinycolor({
		r: lerp( rgb1.r, rgb2.r, t ),
		g: lerp( rgb1.g, rgb2.g, t ),
		b: lerp( rgb1.b, rgb2.b, t )
	})
}
var lerpColors = ( s1, s2, t ) => ({
	foreground: lerpColor( s1.foreground, s2.foreground, t ),
	background: lerpColor( s1.background, s2.background, t )
})
var lerpColorsArray = ( arr, t ) => {
	t = clamp( t, 0, arr.length - 1 );
	var from = Math.floor( t );
	var to = Math.ceil( t );
	return lerpColors( arr[ from ], arr[ to ], t - from );
}
var sameColor = ( c1, c2 ) => c1.toHexString() === c2.toHexString();

var TEST_SIZE = 500;
var MARGIN = .1;
var LINE_HEIGHT = .76;
var ZIGZAG = .37;

// var fontSize = 0;

var font = size => `${ Math.floor( size ) }px "Arial Black"`;

var onResize = () => {
	canvas.width = window.innerWidth * window.devicePixelRatio;
	canvas.height = window.innerHeight * window.devicePixelRatio;
	var targetWidth = canvas.width * ( 1 - MARGIN * 2 );
	daCtx.font = font( TEST_SIZE );
	var fontSize = TEST_SIZE * ( targetWidth / daCtx.measureText( 'DAD' ).width );
	daCtx.font = font( fontSize );
	var daWidth = daCtx.measureText( 'DA' ).width;
	da.width = daWidth;
	da.height = fontSize * LINE_HEIGHT;
	daCtx.font = font( fontSize );
	daCtx.textBaseline = 'middle'
	daCtx.fillText( 'DA', 0, da.height * .61 );
}

var draw = () => {
	ctx.clearRect( 0, 0, canvas.width, canvas.height );
	var p = window.pageYOffset;
	var rows = Math.floor( Math.ceil( canvas.height / da.height ) / 2 ) * 2 + 1;
	var baseX = canvas.width * MARGIN;
	var baseY = canvas.height / 2 - ( da.height * rows ) / 2;
	var zigzag = da.height * ZIGZAG;
	var off = Math.floor( rows / 2 ) % 2 ? true : false;
	ctx.globalCompositeOperation = 'source-over';
	for ( var row = 0; row < rows; row++ ) {
		var x = baseX + ( off ? -p + zigzag : p );
		var y = baseY + row * da.height;
		while ( x > 0 ) x -= da.width;
		while ( x < canvas.width ) {
			ctx.drawImage( da, x, y );
			x += da.width;
		}
		off = !off;
	}
	var colorIndex;
	for ( var i = 0; i < sections.length; i++ ) {
		var rect = sections[ i ].getBoundingClientRect();
		if ( rect.top <= 0 ) {
			colorIndex = i + -rect.top / rect.height;
			break;
		}
	}
	var { background, foreground } = lerpColorsArray( colors, colorIndex );
	arrow.classList.toggle( 'blue', sameColor( background, WHITE ) );
	var atInfo = Math.floor( colorIndex ) >= sections.length - 1;
	arrow.classList.toggle( 'up', atInfo );
	arrow.href = atInfo ? '#top' : '#info';
	ctx.globalCompositeOperation = 'source-in';
	ctx.fillStyle = foreground.toHexString();
	ctx.fillRect( 0, 0, canvas.width, canvas.height );
	ctx.globalCompositeOperation = 'destination-over';
	ctx.fillStyle = background.toHexString();
	ctx.fillRect( 0, 0, canvas.width, canvas.height );
}

new FontFaceObserver('Arial Black').load().then(() => {
	window.addEventListener('resize', () => {
		onResize();
		draw();
	});
	window.addEventListener( 'scroll', draw, { passive: true })
	onResize();
	draw();
})