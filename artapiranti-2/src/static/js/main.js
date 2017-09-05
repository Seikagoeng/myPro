$(function () {
  // if ($(".css-cdn-fallback:first").is(":visible") !== true) {
  //   $('<link rel="stylesheet" href="./static/css/main.min.css">').appendTo('head');
  // }
  $('.loading-div').remove();
  $('.wrap').removeClass('gaosiBlur');
  $('#fullpage').fullpage({
    verticalCentered: true,
    resize: true,
    easing: 'easeInQuart',
    anchors: ['about', 'product', 'career', 'contact'],
    scrollingSpeed: 1000,
    navigation: true,
    // slidesNavigation: true,
    // slidesNavPosition: 'bottom',
    menu: '.nav',
    fixedElements: '.header, .footer',
    scrollOverflow: true,
    lazyloading: true,
    afterLoad: function (anchorLink, index) {
      $('.section').removeClass('pageAnim');
      $('.section').eq(index - 1).addClass('pageAnim');
    },
    onLeave: function (index, nextIndex, direction) {
      $('.slide').removeClass('slideAnim');
      if (nextIndex === 2 || nextIndex === 4) {
        $('.slide.active').eq(nextIndex === 2 ? 0 : 1).addClass('slideAnim');
      }
    },
    onSlideLeave: function (anchorLink, index, slideIndex, direction, nextSlideIndex) {
      // console.log(anchorLink, index, slideIndex, direction, nextSlideIndex)
      $('.slide').removeClass('slideAnim');
      $('.slide').eq(nextSlideIndex).addClass('slideAnim');
    }
  });
});
