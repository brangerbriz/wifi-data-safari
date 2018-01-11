Vue.component('list-station-detail', {
    props:{
        DataObj:Object
    },
    methods:{
        formatSeconds:formatSeconds,
        printSeen:printSeen
    },
    template:`<div>
        <div>
            {{ printSeen(DataObj.firstSeen,DataObj.lastSeen,'device') }}
            it was made by <b>{{DataObj.vendor}}</b>
            <span v-if="DataObj.probes.length>0">
                and has connected to the following networks:
                <b>{{ DataObj.probes.join(',') }}</b>.
            </span>

        </div>

    </div>`
})
