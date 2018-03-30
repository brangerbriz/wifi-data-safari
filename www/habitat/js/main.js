const socket = io(`http://${window.location.host}`)
socket.on('networks',(ns)=>{ns.forEach((n)=>app.addDevice(n))})
socket.on('stations',(ss)=>{ss.forEach((s)=>app.addDevice(s))})
// socket.on('dns-request',(domain)=>{habitat.addCloud(domain)})

const habitat = new Habitat({
    debug: false,
    // test:500,
    fog: true,
    bgColor:'#c4e7f2',
    worldSize:[1200, 600, 800]
})

const app = new Vue({
    el: '#app',
    data: {
        networks:{},
        stations:{}
    },
    created: function(){
        habitat.setupScene()
        habitat.drawScene()
    },
    methods:{
        addDevice:function(dev){
            if( this[`${dev.type}s`].hasOwnProperty(dev.mac) ){
                // update stations||networks dictionary w/new data
                this.$set( this[`${dev.type}s`], dev.mac,
                        Object.assign(this[`${dev.type}s`][dev.mac],dev) )
            } else {
                // add new device to stations||networks dictionary
                this.$set( this[`${dev.type}s`], dev.mac,
                        Object.assign({},dev) )
                // create new butterfly for this device
                if( dev.type=='station') habitat.addButterfly( dev )
                // or create new flower for this device
                else if( dev.type=='network'){
                    // TODO maybe limit flowers to "active networks"
                    // ie. only networks w/devices associated?
                    if(dev.ssid!=="") habitat.addFlower( dev )
                }
            }

            // let habitat know about associated stations
            for(let mac in this.stations){
                if(typeof this.stations[mac].network=="string")
                    habitat.updateAssoButterfly(mac,this.stations[mac].network)
            }
        }
    }
})
