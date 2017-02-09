// Useful variables.
var date,
	largestAsteroid = null,
	fastestAsteroid = null,
	daysInMonth = {
		1: 31,
		2: 28,
		3: 31,
		4: 30,
		5: 31,
		6: 30,
		7: 31,
		8: 31,
		9: 30,
		10: 31,
		11: 30,
		12: 31
	}

// DOM elements.
var $month = $('#month'),
	$day = $('#day'),
	$dayOptions = $day.find('option'),
	$find = $('#find'),
	$countTitle = $('#count-title'),
	$objects = $('#objects'),
	$tooltips = $('.tooltip_templates');

$(document).ready(function() {

	// When the month changes, disable any days that aren't in that month.
	$month.on('change', function() {
		var days = daysInMonth[ parseInt( $(this).val() ) ];

		$day.val( '01' );

		$dayOptions.each( function(i, el) {
			$(el).attr( 'disabled', i + 1 > days ? 'disabled' : false );
		});

	}).change();

	// Handle form submission.
	$find.on('submit', function(e) {
		e.preventDefault();

		showLoadingStatus();

		var month = $month.val(),
			day = $day.val(),
			year = '2016';
		
		window.date = year + '-' + month + '-' + day;

		$.ajax('//www.neowsapp.com/rest/v1/feed?start_date=' + date + '&end_date=' + date +'&detailed=false', {
			dataType: 'json',
			success: checkResults,
			error: switchToError,
		});

	});

	// Bring in our content initially.
	var tl = new TimelineMax();
	tl.set('#earth', { display: 'block', x: '10%', y: '100%', z: -300 });
	tl.to('#earth', 5, {x: '0%', y: '0%', ease: Power2.easeOut }, 'earthIn');
	tl.to('#earth', 7, { z: -100, ease: Power1.easeOut}, 'earthIn');
	tl.staggerFromTo('.stagger-in', 1, {y: '100', opacity: 0}, {y: 0, opacity: 1, ease: Power2.easeOut}, 0.5, 1 );

	// Start the loading indicator spinning forever.
	var loading = new TimelineMax({repeat: -1});
	loading.to('.loading', 0.33, { rotation: 360, ease: Power0.easeNone});


});

// Create our asteroids!
function createAsteroids(data) {

	var count = data.element_count,
		asteroids = data.near_earth_objects[date].sort( function(a, b) {
			return b.estimated_diameter.feet.estimated_diameter_max - a.estimated_diameter.feet.estimated_diameter_max;
		});

	// Zero out any old data (shouldn't happen, but you never know).
	$objects.html('');
	largestAsteroid = null;
	fastestAsteroid = null;

	// Set the title info.
	var plural = count > 1;
	$countTitle.find('#count').text( count );
	$countTitle.find('#waswere').text( plural ? 'were' : 'was' );
	$countTitle.find('#plural').text( plural ? 's' : '');

	// Find the largest/fastest asteroids, so we can use them to scale the others.
	findLargestAsteroid( asteroids );
	findFastestAsteroid( asteroids );

	// Create all of our asteroids and their associated tooltip information.
	for ( var i=0; i < count; i++ ) {

		var asteroid = asteroids[i],
			$obj = $('<div class="object"><div class="asteroid tooltip" data-tooltip-content="#asteroid-'+i+'"></div></div>'),
			$tooltip = $('<div id="asteroid-'+i+'"><h5 class="name text-center"></h5><p><strong>Diameter:</strong> <span class="min"></span> - <span class="max"></span> feet</p><p><strong>Closest Approach:</strong> <span class="distance"></span> miles</p><p><strong>Velocity at Approach:</strong> <span class="vel"></span> MPH</p></div>'),
			diaMax = asteroid.estimated_diameter.feet.estimated_diameter_max,
			widthPercent = ( diaMax / largestAsteroid * 100 ),
			marginPercent = (100 - widthPercent) / 2,
			velRatio = fastestAsteroid / asteroid.close_approach_data[0].relative_velocity.miles_per_hour;
			$objAsteroid = $obj.find('.asteroid');

		// Size our asteroid.
		// Asteroids are all relatively sized (which can create some tiny asteroids, but it's still an interesting visual).
		$objAsteroid.css({ 
			width: widthPercent + '%',
			paddingBottom: widthPercent + '%',
			margin: marginPercent + '% auto'
		});

		// Populate our tooltip.
		$tooltip.find('.name').text( asteroid.name );
		$tooltip.find('.min').text( Math.round(asteroid.estimated_diameter.feet.estimated_diameter_min) );
		$tooltip.find('.max').text( Math.round(asteroid.estimated_diameter.feet.estimated_diameter_max) );
		$tooltip.find('.vel').text( Math.round(asteroid.close_approach_data[0].relative_velocity.miles_per_hour) );
		$tooltip.find('.distance').text( Math.round(asteroid.close_approach_data[0].miss_distance.miles) );

		// Add our new asteroid and tooltip to the DOM.
		$objects.append( $obj );
		$tooltips.append( $tooltip );

		// Give the asteroid a spin for some visual interest.
		// Speed of the spin is relative to the velocity of the asteroid. Direction is random.
		TweenMax.set( $obj, { rotation: ~~( Math.random() * 360 ) } )
		var tl = new TimelineMax({ repeat: -1 });
		tl.to( $obj, 5 * velRatio , { rotation: Math.random() > 0.5 ? '+=360' : '-=360', ease: Power0.easeNone  } );

	}

	// Initialize our new tooltips.
	$('.tooltip').tooltipster({ trigger: 'click'});

}

// Find the biggest asteroid.
function findLargestAsteroid( asteroids ) {
	$.each(asteroids, function(i, asteroid) {
		var thisMax = asteroid.estimated_diameter.feet.estimated_diameter_max;
		if ( thisMax > largestAsteroid ) largestAsteroid = thisMax;
	});
}

// Find the fastest asteroid. We'll use this to influence rotation speed.
function findFastestAsteroid( asteroids ) {
	$.each(asteroids, function(i, asteroid) {
		var thisVel = asteroid.close_approach_data[0].relative_velocity.miles_per_hour;
		if ( thisVel > fastestAsteroid ) fastestAsteroid = thisVel;
	});
}
// Show a loading icon while we get our results.
function showLoadingStatus() {
	TweenMax.to('.form form', 0.5, { opacity: 0, scale: 0.5, ease: Back.easeIn });
	TweenMax.fromTo('.form .loading', 0.5, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, ease: Back.easeOut });
}

// See if we have results or not.
function checkResults(data) {
	if ( data.element_count && data.element_count > 0 ) {
		switchToResults(data);
	}
	else {
		switchToNoResults();
	}
}

// Show the "No Results" section.
function switchToNoResults() {
	var tl = new TimelineMax();
	tl.add( slideOutIntroAndForm() );
	tl.set('.no-objects', { display: 'block', opacity: 0 });
	tl.fromTo('.no-objects', 1, {y: 100, opacity: 0}, {y: 0, opacity: 1, ease: Power2.easeOut});
}

// Show the error screen if we've bad results.
function switchToError() {
	var tl = new TimelineMax();
	tl.add( slideOutIntroAndForm() );
	tl.set('.error', { display: 'block', opacity: 0 });
	tl.fromTo('.error', 1, {y: 100, opacity: 0}, {y: 0, opacity: 1, ease: Power2.easeOut});
}

// Hide our intro stuff and bring in the results.
function switchToResults(data) {

	createAsteroids(data);

	var tl = new TimelineMax();
	tl.add( slideOutIntroAndForm() );
	tl.set('.objects-container', { display: 'block', opacity: 0 });
	tl.fromTo('.objects-container', 1, {y: 100, opacity: 0}, {y: 0, opacity: 1, ease: Power2.easeOut});
}

// We do this repeatedly, so it's simpler to do it once in a function.
// This returns a timeline, which we can add to our other timelines (timelineception?).
function slideOutIntroAndForm() {
	var tl = new TimelineMax();
	tl.staggerTo(['.intro-text', '.form'], 1, { y: '-100vh', opacity: 0, ease: Back.easeIn }, 0.5);
	tl.set(['.intro-text', '.form'], { display: 'none' });	
	return tl;
}
