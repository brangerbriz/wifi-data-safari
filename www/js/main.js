const socket = io('http://localhost:1337')
// TODO add conditioanl logic in callbacks for eye-button
socket.on('networks',(ns)=>ns.forEach((n)=>app.add('networks',n)))
socket.on('stations',(ss)=>ss.forEach((s)=>app.add('stations',s)))

const app = new Vue({
    el: '#app',
    data: {
        visiblityTime:6000,
        networks:{},
        stations:{},
        networksCount:0,
        stationsCount:0,
        // showNetworks:true,
        // showStations:true
    },
    methods:{
        allDevices:function(){
            return Object.assign({},this.networks,this.stations)
        },
        orderedDevices:function(){
            // order by signal strength
            // only networks && probing stations (not associated)
            let ordered = []
            let devs = Object.assign({},this.networks,this.stations)
            for( let m in devs ){
                if( typeof devs[m].network == 'string' ){
                    // include associated stations if their network is missing
                    if( !this.networks.hasOwnProperty(devs[m].network) ){
                        ordered.push( devs[m] )
                    }
                } else {
                    ordered.push( devs[m] )
                }
            }
            ordered.sort((a,b)=>a.power-b.power)
            return ordered
        },
        updateConnectedDevices:function(netMac,devMac){
            if( typeof this.networks[netMac]!=='undefined'){
                let clients = []

                // if called on new network, else called on new station
                if( typeof devMac == 'undefined')
                    for( let dev in this.stations )
                        if(this.stations[dev].network==netMac)
                            clients.push(this.stations[dev].mac)
                else clients = [ ...this.networks[netMac].clients, devMac ]

                this.$set(this.networks[netMac],'clients',clients)

            } else { // for debugging
                if( typeof devMac == 'undefined')
                    console.log(`tried to update ${netMac}, but not in list`)
                else
                    console.log(`tried to add ${devMac} to ${netMac}`)
            }
        },
        add:function(dict,n){
            if( !this[dict].hasOwnProperty(n.mac) )
                this.$set(this[dict], n.mac, Object.assign({},n,{
                    remove:null,
                    clients:[]
                }))
            else
                clearTimeout( this[dict][n.mac].remove )

            // update count
            this[dict+'Count'] = Object.keys(this[dict]).length

            // update connected devices list
            if( dict=="networks")
                this.updateConnectedDevices(n.mac)
            else if( dict=="stations" && n.network)
                this.updateConnectedDevices(n.network,n.mac)

            // create||reset the remove timer
            this[dict][n.mac].remove = setTimeout(()=>{
                this.$delete(this[dict],n.mac)
                this[dict+'Count'] = Object.keys(this[dict]).length
            },this.visiblityTime)
        }
    }
})
