Vue.component('list-network-detail', {
    props:{
        DataObj:Object
    },
    methods:{
        formatSeconds:formatSeconds,
        printSeen:printSeen,
        printSecurity:printSecurity
    },
    template:`<div>
        <div style="padding-bottom:10px">
            MAC Address: <b>{{DataObj.mac}}</b>
        </div>
        <div>
            {{ printSeen(DataObj.firstSeen,DataObj.lastSeen,'network') }}
            it was manufactured by <b>{{DataObj.vendor}}</b>,
            <span v-if="DataObj.privacy=='OPN'">
                and it's <b>Open</b> (no security).
            </span>
            <span v-else>
                and it's using <b>
                {{ printSecurity(DataObj.privacy,DataObj.cipher,DataObj.auth) }}
                </b> security.
            </span>
        </div>
    </div>`
})
