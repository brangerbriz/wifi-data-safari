const socket = io(`http://${window.location.host}`)

socket.on('networks',(ns)=>{
    if(!app.paused) ns.forEach((n)=>app.add('networks',n))
})

socket.on('stations',(ss)=>{
    if(!app.paused) ss.forEach((s)=>app.add('stations',s))
})

const app = new Vue({
    el: '#app',
    data: {
        paused:false,
        filterList:[],
        visiblityTime:6000,
        networks:{},
        stations:{},
        networksCount:0,
        stationsCount:0
    },
    methods:{
        // ----
        // add/remove a filter from the filterList
        // ---- [used publicly]
        addFilter:function(obj){
            for (let i = 0; i < this.filterList.length; i++) {
                if( this.filterList[i].type == obj.type ) return
            }
            this.filterList.push( obj )
        },
        removeFilter:function(type){
            this.filterList = this.filterList.filter(f=>f.type!==type)
        },
        // ----
        // these two methods handle resetting timeouts when pause is toggled
        // ---- [used in togglePause]
        killTimeouts:function(dict){
            for(var n in this[dict]) clearTimeout( this[dict][n].remove )
        },
        resetTimeouts:function(dict){
            for (var n in this[dict])
                this[dict][n].remove = setTimeout(()=>{
                    this.$delete(this[dict],n)
                    this[dict+'Count'] = Object.keys(this[dict]).length
                },this.visiblityTime)
        },
        // ----
        // toggle the paused state
        // ---- [used publicly]
        togglePause:function(){
            // stop receiving new updates from sockets
            this.paused = !this.paused
            // handle updating timeouts when pause is toggled
            if(this.paused){
                this.killTimeouts('stations')
                this.killTimeouts('networks')
            } else {
                this.resetTimeouts('stations')
                this.resetTimeouts('networks')
            }
        },
        allDevices:function(){
            return Object.assign({},this.networks,this.stations)
        },
        // ----
        // return ordered list of all devices as array of objects
        // ---- [used publicly]
        orderedDevices:function(){
            // order by signal strength
            // only networks && probing stations (not associated)
            let ordered = []
            let devs = Object.assign({},this.networks,this.stations)
            for( let m in devs ){
                if( typeof devs[m].network == 'string' ){
                    // include associated stations if their network is missing
                    if( !this.networks.hasOwnProperty(devs[m].network) )
                        ordered.push( devs[m] )
                } else {
                    ordered.push( devs[m] )
                }
            }
            ordered.sort((a,b)=>b.power-a.power)

            // if a filter is set filter accordingly
            if( Object.keys(this.filterList).length > 0 ){
                let arr = [...ordered]
                this.filterList.forEach((f)=>{
                    arr = arr.filter( d => d[f.type]==f.data )
                })
                return arr
            }

            return ordered
        },
        // ----
        // figure out who's connected to who
        // ---- [used in .add method]
        updateConnectedDevices:function(netMac,devMac){
            if( typeof this.networks[netMac]!=='undefined'){
                let clients = {}

                if( typeof devMac == 'undefined'){
                    // if called to add new network
                    for( let mac in this.stations ){
                        if(this.stations[mac].network==netMac){
                            clients[mac] = this.stations[mac]
                        }
                    }
                } else {
                    // if called to add new station
                    clients = Object.assign({},this.networks[netMac].clients)
                    clients[devMac] = this.stations[devMac]
                }

                this.$set(this.networks[netMac],'clients',clients)

            } else { // for debugging
                if( typeof devMac == 'undefined')
                    console.log(`tried to update ${netMac}, but not in list`)
                else
                    console.log(`tried to add ${devMac} to ${netMac}`)
            }
        },
        // ----
        // call everytime sockets emit new data to add
        // ----
        add:function(dict,n){
            if( !this[dict].hasOwnProperty(n.mac) )
                this.$set(this[dict], n.mac, Object.assign({},n,{
                    remove:null,
                    clients:{}
                }))
            else
                clearTimeout( this[dict][n.mac].remove )

            // debugging
            // if( n.randomMac ) console.log(`randomMac: ${n.mac}, type:${dict}`)
            if( n.randomMac && dict=="stations" ) console.log(`randomMac: ${n.mac}`)

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
