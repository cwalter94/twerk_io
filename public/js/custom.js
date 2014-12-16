(function ($) {

	new WOW().init();

	jQuery(window).load(function() { 
		jQuery("#preloader").delay(100).fadeOut("slow");
		jQuery("#load").delay(100).fadeOut("slow");
	});
	//jQuery for page scrolling feature - requires jQuery Easing plugin
	$(function() {
		$('.btn-main').bind('click', function(event) {

			$('body').stop().animate({
				scrollTop: $('#about').offset().top
			}, 1500, 'easeInOutExpo');
			event.preventDefault();
		});
//		$('.btn-animated').bind('click', function(event) {
//			var $anchor = $(html);
//			$('html, body').stop().animate({
//				scrollTop: $($anchor.attr('href')).offset().top
//			}, 1500, 'easeInOutExpo');
//			event.preventDefault();
//		});
	});

})(jQuery);
