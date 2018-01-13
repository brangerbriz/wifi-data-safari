Vue.component('list-station', {
    data:function(){return {
        showDetail:false
    }},
    props:{
        DataObj:Object,
        DataNested:Boolean
    },
    computed:{
        getColor:getColor
    },
    methods:{
        emitFilt:emitFilt
    },
    template:`<div>

        <div class="list-item-heading" v-on:click="showDetail=!showDetail">
            <svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 373 373" width="50">
                <title>butterfly</title>
                <path
                v-bind:style="{fill:getColor}" d="M261.06,263.35q0,7.69-.08,15.38l-.27,2.21c-7,27.71-26,25.79-45.58,13.53-14.41-9.05-22.58-23.52-28.33-39.29-.93-2.57-1.79-5.16-3.21-9.31-4.82,16.37-11.54,29.94-22.37,41.18-6.74,7-14.6,12.1-24.14,14.37-16.87,4-28.24-3.8-30-21.24a113,113,0,0,1,1-30.71,139.18,139.18,0,0,1,3.57-14.93c.79-2.7.89-4.05-2.47-4.77-26-5.55-41.6-23.39-52.1-46.11-10.88-23.54-18.28-48.47-27.36-72.74C26,101.06,22.38,91.19,19,81.24c-3.13-9.07-1.49-12.06,7.52-14.66,29.6-8.55,56.29-.87,81.37,14.92,32.37,20.39,55.84,48.73,73,82.62,1,2.06,2,4.15,3.1,6.2.2.39.68.65,1.43,1.34,8.1-16.49,17-32.35,28.57-46.51,21.5-26.38,46.59-47.88,79.62-58.11a87.1,87.1,0,0,1,49.17-.72c9.94,2.78,11.64,5.75,8.09,15.74q-8.88,25-18.15,49.91c-6.32,17.08-12,34.47-19.4,51.07-9.5,21.25-24,38.26-47.24,45.59-10.33,3.25-10.38,3-8.05,14.1.69,3.26,1.22,6.55,1.83,9.82C261.1,258.72,260.46,259.78,261.06,263.35Z"/>
            </svg>
            <span> {{ DataObj.mac }} </span>
            <span v-if="!DataNested">
                <span v-if="DataObj.network" style="color:red">connected?</span>
                <span v-else>probing</span>
            </span>
        </div>

        <list-station-detail
            class="list-item-detail"
            v-if="showDetail"
            v-bind:data-obj="DataObj"
            v-bind:style="{borderColor:getColor}"
            v-on:filt="emitFilt($event)"
        ></list-station-detail>

    </div>`
})
