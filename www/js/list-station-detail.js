Vue.component('list-station-detail', {
    props:{
        DataObj:Object,
        DataNested:Boolean
    },
    methods:{
        formatSeconds:formatSeconds,
        printSeen:printSeen,
        emitFilt:emitFilt
    },
    template:`<div>
        <div>
            <span v-if="DataObj.firstSeen==DataObj.lastSeen">
                It's the first time seeing this
                <b v-if="DataNested">device</b>
                <b v-else
                    class="filter"
                    v-on:click="emitFilt('type','station')"
                >device</b>.
            </span>
            <span v-else>
                You first saw this
                <b v-if="DataNested">device</b>
                <b v-else
                    class="filter"
                    v-on:click="emitFilt('type','station')"
                >device</b>
                {{ printSeen(DataObj.firstSeen,DataObj.lastSeen) }}
                ago.
            </span>

            <span v-if="DataObj.randomMac">
                This device is likely
                <b v-if="DataNested">randomizing</b>
                <b v-else
                    class="filter"
                    v-on:click="emitFilt('randomMac',DataObj.randomMac)"
                >randomizing</b> their MAC address.
            </span>
            <span v-else>
                This device is using a
                <b v-if="DataNested">unique</b>
                <b v-else
                    class="filter"
                    v-on:click="emitFilt({type:'randomMac',data:DataObj.randomMac})"
                >unique</b> MAC address.
            </span>

            <span v-if="DataObj.vendor">
                It was made by
                <b v-if="DataNested">{{DataObj.vendor}}</b>
                <b v-else
                    class="filter"
                    v-on:click="emitFilt('vendor',DataObj.vendor)"
                > {{DataObj.vendor}}</b>
            </span>


            <span v-if="DataObj.probes.length>0">
                <span v-if="DataObj.vendor">and </span>
                <span v-else>It</span>
                has previously connected to the following networks:
                <b> {{ DataObj.probes.join(', ') }}</b>
            </span>

        </div>

    </div>`
})
