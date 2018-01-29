const socket = io(`http://${window.location.host}`)
socket.on('networks',(ns)=>{ns.forEach((n)=>app.addDevice(n))})
socket.on('stations',(ss)=>{ss.forEach((s)=>app.addDevice(s))})

const habitat = new Habitat({
    debug:true,
    // test:500,
    fog: true,
    bgColor:'#cce0ff',
    worldSize:[1000, 800, 800]
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
            }
        }
    }
})
