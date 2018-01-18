Vue.component('list-network', {
    data:function(){return {
        showDetail:false
    }},
    props:{
        DataObj:Object
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
                <title>flower</title>
                <path style="color:#f4eef6" d="M154.93,83l0-.49a2.47,2.47,0,0,1,.16.37S155,82.94,154.93,83Z"/>
                <circle v-bind:style="{fill:getColor}" cx="121.66" cy="131.49" r="50.31"/>
                <circle v-bind:style="{fill:getColor}" cx="186.48" cy="103.03" r="50.31"/>
                <circle v-bind:style="{fill:getColor}" cx="247.35" cy="129.91" r="50.31"/>
                <circle v-bind:style="{fill:getColor}" cx="268.69" cy="186.83" r="50.31"/>
                <circle v-bind:style="{fill:getColor}" cx="102.68" cy="189.99" r="50.31"/>
                <circle v-bind:style="{fill:getColor}" cx="121.66" cy="240.58" r="50.31"/>
                <circle v-bind:style="{fill:getColor}" cx="186.48" cy="269.04" r="50.31"/>
                <circle v-bind:style="{fill:getColor}" cx="247.35" cy="242.16" r="50.31"/>
                <circle style="fill:#fff" cx="186.23" cy="186.8" r="42.16"/>
            </svg>
            <span> {{ DataObj.ssid.length>0 ? DataObj.ssid : 'un-named' }} </span>
            <span> {{ DataObj.power }} dBm </span>
        </div>

        <list-network-detail
            class="list-item-detail"
            v-if="showDetail"
            v-bind:data-obj="DataObj"
            v-bind:style="{borderColor:getColor}"
            v-on:filt="emitFilt($event)"
        ></list-network-detail>

        <span v-if="Object.keys(DataObj.clients).length>0">
            <list-station
                v-for="c in DataObj.clients"
                v-bind:key="c.mac"
                v-bind:data-obj="c"
                v-bind:data-nested="true"
                class="indented"
            ></list-station>
        </span>


    </div>`
})
