$(document).ready(function(){
    $(window).scroll(function(){
        if($(this).scrollTop()){
            $('#backtop').fadeIn();
        }else{
            $('#backtop').fadeOut();
        }
    });
    $('#backtop').click(function(){
        $('html,body').animate({scrollTop: 0},300);
    });
});

(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        return;
    }

    const revealElements = document.querySelectorAll(
        '.content > .headline, .content > ul.products > li, .content > .img-adv-list > li, ' +
        '.content > ul.trademark-list > li, .content > .news-watches > div, ' +
        '.footer .footer-list > li, .footer .area-contact .location'
    );

    document.documentElement.classList.add('motion-ready');

    revealElements.forEach((element, index) => {
        element.classList.add('scroll-reveal');
        element.style.setProperty('--reveal-delay', `${(index % 4) * 65}ms`);
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -28px 0px'
    });

    revealElements.forEach((element) => revealObserver.observe(element));
})();
// 



