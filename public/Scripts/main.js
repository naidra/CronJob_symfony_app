(function ($) {
    'use strict';
    $(document).ready(function () {
        // For new design
        syncMenu();
        const navigationSidebar = $('.navigation-sidebar');
        navigationSidebar.css({ '--pad-top': '74px' });
        let scrollStoptimeout = null;
        function adjustHeight() {
            if (scrollStoptimeout) clearTimeout(scrollStoptimeout);
            scrollStoptimeout = setTimeout(() => { navigationSidebar.css({ '--height': `${window.innerHeight}px` }); }, 400);
        }
        $(window).on('scroll resize touchmove', adjustHeight);
        adjustHeight();

        // if (document.querySelectorAll('.alert .close').length)
        //     setTimeout(() => document.querySelector('.alert .close')?.click(), 5000);

        Array.from(document.querySelectorAll('.alert .close')).forEach(button => button.addEventListener('click', function (e) {
            button.parentNode.remove();
        }));

        // Initialize all tooltios
        Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(btn => new bootstrap.Tooltip(btn));

        Array.from(document.querySelectorAll('.datepicker-here[value]'), dateInput => {
            const datepicker = $(dateInput).datepicker().data('datepicker');
            const [day, monthName, year] = dateInput.getAttribute('value').split(' ');
            if (/^[A-Za-z]*$/.test(monthName) && monthName != undefined) { // Check if it contains only letters (so we know that it's month's name)
                const month = datepicker.loc.months.indexOf(monthName);
                datepicker.selectDate(new Date(year, month, day));
            }
        });
    });

    function syncMenu() {
        const allMenuItems = Array.from(document.querySelectorAll('.navigation-sidebar [data-text]'));
        let pageOnHref = location.pathname.substring(1).replaceAll('/', '');

        allMenuItems.forEach(item => {
            const dataTexts = item.getAttribute('data-text').split(',');
            const textMatches = dataTexts.includes(pageOnHref);
            if (textMatches) {
                const isInner = item.classList.contains('inner');
                (isInner ? item : item.parentNode).classList.add('active');
                $(isInner ? item.parentNode.parentNode : item.parentNode.parentNode.nextElementSibling).collapse('show');
            }
        });
    }

    addEventListener('DOMContentLoaded', (event) => {
        const allMenuLinks = document.querySelectorAll(".drop-down-menu-items");
        for (let i = 0; allMenuLinks.length > i; i++) {
            allMenuLinks[i].parentElement.classList.remove("active");
            allMenuLinks[i].parentElement.parentElement.parentElement.querySelector("input").checked = false;
            const aHref = allMenuLinks[i].querySelector('[data-text]').getAttribute('data-text').split(',');

            if (aHref.includes(location.pathname.substring(1).replaceAll('/', ''))) {
                const menuLinkDiv = allMenuLinks[i].parentElement.parentElement.parentElement;
                const menuLinkInput = menuLinkDiv.querySelector("input[type='checkbox']");
                const menuLinkLi = allMenuLinks[i].parentElement;
                setTimeout(() => { menuLinkInput.checked = true; }, 1000);
                menuLinkLi.classList.add("active");
            }
        }
    });

    const scrollTarget = document.querySelector('.can-be-sticky');
    const debounce = (func, delay) => {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        }
    }

    function callback() {
        scrollTarget.classList[scrollTarget.offsetTop <= 96 ? 'remove' : 'add']("pageheader-shadow");
    }

    if (scrollTarget) addEventListener('scroll', debounce(callback, 100));
}(jQuery));

addEventListener('load', (event) => {
    // Initialize select tags using select2.js library
    $("select:not(.for-pdf):not(.with-search)")
        .select2({ minimumResultsForSearch: -1 })
        .siblings(".select2-container").css({
            "border": "1px solid rgb(196, 196, 196)",
            "border-radius": "10px",
            "overflow": "hidden"
        });
});

function number_format(number, dec_point = ",", thousands_step = ".") {
    number = (+number);
    var nstr = number.toString();
    nstr += '';
    var x = nstr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? dec_point + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1))
        x1 = x1.replace(rgx, '$1' + thousands_step + '$2');
    return x1 + x2 !== "NaN" ? x1 + x2 : "0";
}

function checkAEDAmount() {
    const [thousands, decimals = '00'] = this.value.split(',');
    const one = number_format(thousands.replace(/[^\d]/g, ''));
    const two = decimals.replace(/[^\d]/g, '').substr(0, 2).padEnd(2, 0);
    this.value = one + ',' + two + ' AED';
}

// Allow the usser to write only numbers and a comma in LPO_approximate_amount field
Array.from(document.querySelectorAll("[name='LPO_approximate_amount']"), input => input.addEventListener('keypress', function(e) {
    if(/[^\d\,]/.test(e.key)) e.preventDefault();
}));