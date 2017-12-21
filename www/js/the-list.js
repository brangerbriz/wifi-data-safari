Vue.component('the-list', {
    props:{
        ShowNetworks:Boolean,
        ShowStations:Boolean,
        'networks':Object,
        'stations':Object
    },
    methods: {
        printNetName:function(val){
            if( val.length == 0 ) return "un-named"
            else return val
        },
        printAPinfo: function(val){
            if(val === null)
                return 'not on WiFi'
            else if(typeof this.networks[val]=="undefined")
                return 'connected to WiFi'
            else
                return `connected to ${this.networks[val].ssid}`
        }
    },
    template:`<div>
        <ul v-if="ShowNetworks">
            <li v-for="net in networks">
                {{ printNetName(net.ssid) }}
                ( {{ net.clients.length }} connected devices )
            </li>
        </ul>
        <ul v-if="ShowStations">
        <li v-for="sta in stations">
            {{ sta.mac }}
            ( {{ printAPinfo(sta.network) }} )
        </li>
        </ul>
    </div>`
})
