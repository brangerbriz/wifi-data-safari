Vue.component('the-header', {
    props:{
        'networks': Number,
        'stations': Number
    },
    template:`<div>
        <div> {{networks}} Networks </div>
        <div> {{stations}} Stations </div>
    </div>`
})
