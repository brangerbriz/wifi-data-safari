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
                <b class="filter" v-on:click="emitFilt('type','station')">
                    device</b>.
            </span>
            <span v-else>
                You first saw this
                <b class="filter" v-on:click="emitFilt('type','station')">
                    device</b>
                {{ printSeen(DataObj.firstSeen,DataObj.lastSeen) }}
                ago.
            </span>

            It was made by

            <b v-if="DataNested">{{DataObj.vendor}}</b>
            <b v-else
                class="filter"
                v-on:click="emitFilt('vendor',DataObj.vendor)"
            > {{DataObj.vendor}}</b>

            <span v-if="DataObj.probes.length>0">
                and has previously connected to the following networks:
                <b> {{ DataObj.probes.join(', ') }}</b>
            </span>

        </div>

    </div>`
})
