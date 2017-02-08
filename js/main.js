$(document).ready(function() {

	var $month = $('#month'),
		$day = $('#day'),
		$dayOptions = $day.find('option'),
		$find = $('#find'),
		$countTitle = $('#count-title'),
		$objects = $('#objects'),
		$tooltips = $('.tooltip_templates');

	// Variables about asteroids.
	var date,
		largestAsteroid = null,
		fastestAsteroid = null;

	var daysInMonth = {
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

	// When the month changes, tailor the number of days.
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
		
		date = year + '-' + month + '-' + day;

		$.getJSON( '//www.neowsapp.com/rest/v1/feed?start_date=' + date + '&end_date=' + date +'&detailed=false', switchToResults);
	});

	// Bring in our content initially.
	var tl = new TimelineMax();
	tl.set('#earth', { display: 'block', y: '100%' });
	tl.to('#earth', 5, { y: '0%', ease: Power2.easeOut });
	tl.staggerFromTo('.stagger-in', 1, {y: '100', opacity: 0}, {y: 0, opacity: 1, ease: Power2.easeOut}, 0.5, 1 );

	// Start the loading indicator spinning forever.
	var loading = new TimelineMax({repeat: -1});
	loading.to('.loading', 0.33, { rotation: 360, ease: Power0.easeNone});

	// Create our asteroids!
	function createAsteroids(data) {
		console.log(data);

		var count = data.element_count,
			asteroids = data.near_earth_objects[date].sort( function(a, b) {
				return b.estimated_diameter.feet.estimated_diameter_max - a.estimated_diameter.feet.estimated_diameter_max;
			});

		// Zero out any old data (shouldn't happen, but you never know).
		$objects.html('');
		largestAsteroid = null;
		fastestAsteroid = null;

		if ( count == 0 ) {
			// Handle no objects.
		}

		else {

			// Set the title info.
			var plural = count > 1;
			$countTitle.find('#count').text( count );
			$countTitle.find('#waswere').text( plural ? 'were' : 'was' );
			$countTitle.find('#plural').text( plural ? 's' : '');

			// Find the largest asteroid, so we can use it to scale the others.
			findLargestAsteroid( asteroids );
			findFastestAsteroid( asteroids );

			// Create the appropriate number of asteroids.
			for ( var i=0; i < count; i++ ) {

				var asteroid = asteroids[i],
					$obj = $('<div class="object"><div class="asteroid tooltip" data-tooltip-content="#asteroid-'+i+'"></div></div>'),
					$tooltip = $('<div id="asteroid-'+i+'"><h4 class="name"></h3><p><strong>Diameter:</strong> <span class="min"></span> - <span class="max"></span> feet</p><p><strong>Closest Approach:</strong> <span class="distance"></span> miles</p><p><strong>Velocity at Approach:</strong> <span class="vel"></span> MPH</p></div>'),
					diaMin = asteroid.estimated_diameter.feet.estimated_diameter_min,
					diaMax = asteroid.estimated_diameter.feet.estimated_diameter_max,
					widthPercent = ( diaMax / largestAsteroid * 100 ),
					heightPercent = widthPercent * ( diaMin / diaMax ),
					marginPercent = (100 - heightPercent) / 2,
					velRatio = fastestAsteroid / asteroid.close_approach_data[0].relative_velocity.miles_per_hour;
					$objAsteroid = $obj.find('.asteroid');

				// Size our asteroid.
				$objAsteroid.css({ 
					width: widthPercent + '%',
					paddingBottom: heightPercent + '%',
					margin: marginPercent + '% auto'
				});

				// Populate our tooltip.
				$tooltip.find('.name').text( asteroid.name );
				$tooltip.find('.min').text( Math.round(asteroid.estimated_diameter.feet.estimated_diameter_min) );
				$tooltip.find('.max').text( Math.round(asteroid.estimated_diameter.feet.estimated_diameter_max) );
				$tooltip.find('.vel').text( Math.round(asteroid.close_approach_data[0].relative_velocity.miles_per_hour) );
				$tooltip.find('.distance').text( Math.round(asteroid.close_approach_data[0].miss_distance.miles) );

				// Add our objects to the DOM.
				$objects.append( $obj );
				$tooltips.append( $tooltip );

				// Give the asteroid a random spin for some visual interest.
				TweenMax.set( $obj, { rotation: ~~( Math.random() * 360 ) } )
				var tl = new TimelineMax({ repeat: -1 });
				tl.to( $obj, 5 * velRatio , { rotation: Math.random() > 0.5 ? '+=360' : '-=360', ease: Power0.easeNone  } );


			}

		}

		// Initialize our tooltips.
		$('.tooltip').tooltipster();

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

	// Hide our intro stuff and bring in the results.
	function switchToResults(data) {

		createAsteroids(data);

		var tl = new TimelineMax();

		tl.staggerTo(['.intro-text', '.form'], 1, { y: '-100vh', opacity: 0, ease: Back.easeIn }, 0.5);
		tl.set(['.intro-text', '.form'], { display: 'none' });
		tl.set('.objects-container', { display: 'block', opacity: 0 });
		tl.fromTo('.objects-container', 1, {y: 100, opacity: 0}, {y: 0, opacity: 1, ease: Power2.easeOut});
	}

});