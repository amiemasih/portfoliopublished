// Wait for the document to load before running the script 
(function ($) {
  
  // All content regions are shown by default (no navigation menu)
  $(window).on('load', function(){
    $('.content-region').show();
  });
  
})(jQuery);
