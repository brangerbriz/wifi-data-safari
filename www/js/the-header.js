Vue.component('the-header', {
    data:function(){return {
        paused:false
    }},
    props:{
        'networks': Number,
        'stations': Number
    },
    methods:{
        eyeClicked:function(){
            this.paused = !this.paused
            this.$emit('eyetoggle')
        }
    },
    template:`<div class="header">

        <span>{{networks}} Networks</span>

        <span>{{stations}} Devices</span>

        <svg
            v-if="!paused"
            v-on:click="eyeClicked()"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 373 373" width="50">
            <title>eye-open</title>
            <rect x="179.13" y="82" width="15.69" height="40.35" rx="5" ry="5"/>
            <rect x="134.73" y="90.97" width="15.69" height="40.35" rx="5" ry="5" transform="matrix(0.94, -0.34, 0.34, 0.94, -29.2, 54.81)"/>
            <rect x="95.94" y="113.38" width="15.69" height="40.35" rx="5" ry="5" transform="matrix(0.8, -0.6, 0.6, 0.8, -59.19, 88.32)"/>
            <rect x="60.58" y="147" width="15.69" height="40.35" rx="5" ry="5" transform="translate(-102.47 108.66) rotate(-48.84)"/>
            <rect x="224.24" y="91.89" width="15.69" height="40.35" rx="5" ry="5" transform="translate(400.45 307.18) rotate(-156.56)"/>
            <rect x="262.28" y="111.89" width="15.69" height="40.35" rx="5" ry="5" transform="translate(399.93 403.27) rotate(-141.63)"/>
            <rect x="296.33" y="144.09" width="15.69" height="40.35" rx="5" ry="5" transform="translate(384.35 500.53) rotate(-131.78)"/>
            <path d="M82.41,189.44l-10.28-8.67c7.12-8.44,25-24.4,32.4-30.27,20.06-16,40.26-26.21,60-30.42a102.46,102.46,0,0,1,39.51-.55c10.94,2,22.07,5.87,34,12,15.53,7.94,30.53,19,44.56,33,2.5,2.48,12.71,13.67,14.93,16.32l-10.28,8.67c-2-2.35-11.9-13.23-14.13-15.44-13-12.95-26.91-23.22-41.21-30.52-10.74-5.49-20.64-9-30.26-10.71a89.05,89.05,0,0,0-34.35.47c-17.72,3.76-36,13.11-54.45,27.78C105.06,167.27,88.27,182.49,82.41,189.44Z"/>
            <circle cx="185.98" cy="186.22" r="41.47"/>
        </svg>
        <svg
            v-else
            v-on:click="eyeClicked()"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 373 373" width="50">
            <title>eye-closed-01</title>
            <rect x="179.13" y="257.1" width="15.69" height="40.35" rx="5" ry="5"/>
            <rect x="134.73" y="248.13" width="15.69" height="40.35" rx="5" ry="5" transform="translate(99.21 -32.42) rotate(19.78)"/>
            <rect x="95.94" y="225.72" width="15.69" height="40.35" rx="5" ry="5" transform="translate(167.24 -13.35) rotate(36.64)"/>
            <rect x="60.58" y="192.09" width="15.69" height="40.35" rx="5" ry="5" transform="translate(183.2 21.04) rotate(48.84)"/>
            <rect x="224.24" y="247.21" width="15.69" height="40.35" rx="5" ry="5" transform="translate(551.36 420.4) rotate(156.56)"/>
            <rect x="262.28" y="227.21" width="15.69" height="40.35" rx="5" ry="5" transform="translate(635.46 273.66) rotate(141.63)"/>
            <rect x="296.33" y="195.01" width="15.69" height="40.35" rx="5" ry="5" transform="translate(667.3 131.72) rotate(131.78)"/>
            <path d="M82.41,190l-10.28,8.67c7.12,8.44,25,24.4,32.4,30.27,20.06,16,40.26,26.21,60,30.42a102.46,102.46,0,0,0,39.51.55c10.94-2,22.07-5.87,34-12,15.53-7.94,30.53-19,44.56-33,2.5-2.48,12.71-13.67,14.93-16.32L287.3,190c-2,2.35-11.9,13.23-14.13,15.44-13,12.95-26.91,23.22-41.21,30.52-10.74,5.49-20.64,9-30.26,10.71a89.05,89.05,0,0,1-34.35-.47c-17.72-3.76-36-13.11-54.45-27.78C105.06,212.17,88.27,196.95,82.41,190Z"/>
        </svg>
    </div>`
})
