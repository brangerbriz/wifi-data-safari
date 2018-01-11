Vue.component('list-network-detail', {
    props:{
        DataObj:Object
    },
    methods:{
        formatSeconds:function(sec){
            if( sec > 60 ){
                // logic via https://stackoverflow.com/a/6313008/1104148
                let h   = Math.floor(sec / 3600)
                let m = Math.floor((sec - (h * 3600)) / 60)
                let s = sec - (h * 3600) - (m * 60)
                if( h > 0 ){
                    return `${h} hours ${m} minutes and ${s} seconds`
                } else {
                    return `${m} minutes and ${s} seconds`
                }

            } else {
                return `${sec} seconds`
            }
        },
        printSeen:function(firstSeen,lastSeen){
            if( firstSeen == lastSeen ){
                return 'It\'s the first time seeing this network,'
            } else {
                let f = new Date(firstSeen)
                let l = new Date(lastSeen)
                let time = this.formatSeconds( (l-f)/1000 )
                return `This network was last seen ${time} ago,`
            }
        },
        printSecurity:function(privacy,cipher,auth){
            return `${privacy}-${auth} (${cipher})`
        }
    },
    template:`<div>
        <div style="padding-bottom:10px">
            MAC Address: <b>{{DataObj.mac}}</b>
        </div>
        <div>
            {{ printSeen(DataObj.firstSeen,DataObj.lastSeen) }}
        </div>
        <div>
            it was manufactured by <b>{{DataObj.vendor}}</b>,
        </div>
        <div>
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
