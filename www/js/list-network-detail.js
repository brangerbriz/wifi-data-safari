Vue.component('list-network-detail', {
    props:{
        DataObj:Object
    },
    methods:{
        formatSeconds:formatSeconds,
        printSeen:printSeen,
        printSecurity:printSecurity,
        emitFilt:emitFilt
    },
    template:`<div>
        <div style="padding-bottom:10px">
            MAC Address: <b>{{DataObj.mac}}</b>
            <div v-if="DataObj.lanIP!=='0.0.0.0'">
                LAN IP: <b>{{DataObj.lanIP}}</b>
            </div>
        </div>

        <div>
            <span v-if="DataObj.firstSeen==DataObj.lastSeen">
                It's the first time seeing this
                <b class="filter" v-on:click="emitFilt('type','network')">
                    network</b>.
            </span>
            <span v-else>
                You first saw this
                <b class="filter" v-on:click="emitFilt('type','network')">
                    network</b>
                {{ printSeen(DataObj.firstSeen,DataObj.lastSeen) }}
                ago.
            </span>

            It was made by
            <b class="filter" v-on:click="emitFilt('vendor',DataObj.vendor)">
                {{DataObj.vendor}}</b>,
            <span v-if="DataObj.privacy=='OPN'">
                and it's
                <b class="filter" v-on:click="emitFilt('privacy','OPN')">
                    Open</b> (no security).
            </span>
            <span v-else>
                and it's using
                <b class="filter" v-on:click="emitFilt('privacy',DataObj.privacy)">
                {{ printSecurity(DataObj.privacy,DataObj.cipher,DataObj.auth) }}</b>
                security.
            </span>
        </div>
    </div>`
})
