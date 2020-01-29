

//Medal to highlight the achievements of the organisation
Vue.component('medal', {
    props: ['medalText1', 'medalText2', 'emptySpace'],
    template: '<div class="medal">' +
        '<div class="ribbon"></div>' +
        '<div class="coin">' +
        '<pre>{{medalText1}}<br><span v-html="spacesNeeded"></span>{{medalText2}}</pre>' +
        '</div>' +
        '</div>',
    computed: {
        spacesNeeded: function () {
            var spaceStr = "";

            for (i = 0; i < this.emptySpace; i++) {
                spaceStr += '&nbsp;';
            }
            return spaceStr
        }
    }
})

new Vue({
    el: '#medal-case'
});

//Courses we offer sun-shape and circle holder
Vue.component('courses-badge', {
    props: ['subject'],
    template: "<div class='circle'>" +
        "<svg id='sun-shape' xmlns='http://www.w3.org/2000/svg' viewBox='-97 0 256 256' fill='white' width='165'>" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "<path d='M48 240 L48 16 L32 0 L16 16 L16 240 L32 256 Z' />" +
        "</svg>" +
        "<p class='courses-text'>{{subject}}</p>" +
        "</div>"
})

new Vue({
    el: '#courses-we-offer'
});



    

