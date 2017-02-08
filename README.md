# neo-birthday
Find a list of Near Earth Objects that approached on your birthday.

This project was built with HTML, Sass, and JavaScript. It is all tied together using [Jekyll](https://jekyllrb.com/) (a static site generator) and is hosted on [GitHub Pages](https://pages.github.com/).

The Sass is organized into partials to make it easier to find individual chunks of code to update and maintain. It includes a custom Flexbox-based grid system I developed that I've used on a couple of other smaller projects.

The JS is written primarily in jQuery. The animations are handled by [GSAP](https://greensock.com/), a popular animation library that vastly simplifies fast, cross-browser animation. You can find the animation bits in main.js by looking for TimelineMax and TweenMax.

I am also using a jQuery plugin called [Tooltipster](http://iamceege.github.io/tooltipster/) to create the tooltips that appear over the asteroids.