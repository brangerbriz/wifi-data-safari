const socket = io(`http://${window.location.host}`)
const habitat = new Habitat({
    debug: false,
    // test:500,
    fog: true,
    bgColor:'#c4e7f2',
    worldSize:[1200, 600, 800]
})

const targ = {
    butterfly: new TargetTracker({z:9}),
    flower: new TargetTracker({z:9}),
    cloud: new TargetTracker({z:9})
}

const app = new Vue({
    el: '#app',
    data: {
        ready: false,
        //
        networks:{},
        stations:{},
        domains:[],
        //
        startTime:new Date(),
        prevDevs:[], // previously chosen butterflies
        prevNets:[], // previously chosen flowers
        curDNSIdx:-1,
        pickedDev:null,
        pickedNet:null,
        pickedDNS:null,
        stationsTally:0,
        limits:{
            domains:Infinity,
            stations:500,
            networks:70
        }
    },
    created: function(){
        habitat.setupScene(()=>{
            socket.on('networks',(ns)=>{ns.forEach((n)=>app.addDevice(n))})
            socket.on('stations',(ss)=>{ss.forEach((s)=>app.addDevice(s))})
            socket.on('dns-request',(domain)=>{app.addCloud(domain)})
            socket.on('wigle-data',w=>app.drawWigleData(w))

            habitat.drawScene(()=>{ this.updateTargets() })

            this.tickDNS(2000)
            this.tickDev(10000)
            this.tickNet(7000)
        })
    },
    methods:{
        // -----------------------
        // utils
        // -----------------------
        printSeen:printSeen, // in component-methods.js
        formatSeconds:formatSeconds,
        printSecurity:printSecurity,
        startTimeStamp:function() {
            let m = [
                "Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"
            ]
            let st = this.startTime
            let t = [ st.getHours(), st.getMinutes()]
            let apm = ( t[0] < 12 ) ? "AM" : "PM"
            t[0] = ( t[0] < 12 ) ? t[0] : t[0] - 12
            t[0] = t[0] || 12
            for ( let i = 1; i < 3; i++ ) {
                if ( t[i] < 10 ) t[i] = "0"+t[i]
            }
            return`${m[st.getMonth()]} ${st.getDate()}, ${t.join(":")} ${apm}`
        },
        pickedDevNetInfo:function(){
            let dev = this.pickedDev
            if( dev.network && this.networks[dev.network] ){
                let n = this.networks[dev.network].ssid
                let arr = [...dev.probes]
                let i = arr.indexOf(n)
                if( i > -1 ) arr.splice(i,1)
                return {
                    network:n,
                    probes: (arr.length>0) ? arr.join(', ') : null
                }
            } else if( dev.probes.length > 0 ){
                return {
                    probes:dev.probes.join(', ')
                }
            } else {
                return false
            }
        },
        // -----------------------
        // updating dictionaries
        // -----------------------
        updateConnectedDevices:function(netMac,devMac){
            if( typeof this.networks[netMac]!=='undefined'){
                let clients = []

                if( typeof devMac == 'undefined'){
                    // if called to add new network
                    for( let mac in this.stations ){
                        if(this.stations[mac].network==netMac){
                            clients.push(mac)
                        }
                    }
                } else {
                    // if called to add new station
                    clients = [...this.networks[netMac].clients]
                    clients.push(devMac)
                }

                this.$set(this.networks[netMac],'clients',clients)

            } else { // for debugging
                // if( typeof devMac == 'undefined')
                //     console.log(`tried to update ${netMac}, but not in list`)
                // else
                //     console.log(`tried to add ${devMac} to ${netMac}`)
            }
        },
        addDevice:function(dev){
            if( this[`${dev.type}s`].hasOwnProperty(dev.mac) ){
                // update stations||networks dictionary w/new data
                this.$set( this[`${dev.type}s`], dev.mac,
                        Object.assign(this[`${dev.type}s`][dev.mac],dev) )
            } else {
                let count = Object.keys(this[`${dev.type}s`]).length
                // if stations reached limit, then rmv oldest
                if( count >= this.limits.stations && dev.type=="station"){
                    // remove oldest station in dictionary...
                    let mac = Object.keys(this.stations)[0]
                    delete this.stations[mac]
                    // ...&& then remove it from the habitat scene
                    habitat.rmvButterfly( mac )
                }

                // create new butterfly for this device
                if( dev.type=='station') {
                    this.$set(this.stations, dev.mac, Object.assign({},dev))
                    habitat.addButterfly( dev )
                    this.stationsTally++
                }
                // or create new flower for this device
                else if( dev.type=='network'){
                    if( count <= this.limits.networks ){
                        this.$set(this.networks, dev.mac, Object.assign({},dev))
                        if(dev.ssid!=="") habitat.addFlower( dev )
                    }
                }
            }

            let d = this[`${dev.type}s`][dev.mac]
            if( d ){
                // update connected devices list
                if( dev.type=="network")
                    this.updateConnectedDevices(d.mac)
                else if( dev.type=="station" && d.network)
                    this.updateConnectedDevices(d.network,d.mac)

                // let habitat know about associated stations
                for(let mac in this.stations){
                    if(typeof this.stations[mac].network=="string")
                    habitat.updateAssoButterfly(mac,this.stations[mac].network)
                }
            }

        },
        addCloud:function(domain){
            habitat.addCloud(domain)
            this.domains.push(domain)
        },
        clearDomains:function(){
            // clear domains that aren't in habitat
            this.domains = this.domains.filter(d => {
                return habitat.clouds.map(c => c.name).includes(d.domain)
            })
        },
        clearStations:function(){

        },
        // -----------------------
        // drawing maps
        // -----------------------
        showDataFor:function(mac){
            if(this.$refs.map){
                this.$refs.map.updateNetList(this.stations[mac].probes)
                socket.emit('get-wigle-data',this.stations[mac])
            }
        },
        drawWigleData:function(w){
            if( w.data.length > 0 ){
                // remove nets that have too many locations
                let filteredData = w.data.filter(d=>d.rank < 100)
                // draw data only if there's any left to draw
                if( filteredData.length > 0 )
                    this.$refs.map.drawData(w.device,filteredData)
                else if(this.stations[w.device])
                    this.stations[w.device].toomany = true
            } else {
                if(this.stations[w.device])
                    this.stations[w.device].nodata = true
            }

            // .... no data message....
            if( this.stations[w.device].nodata ||
                this.stations[w.device].toomany){
                this.$refs.mapcover.style.display = "block"
                // colorodo gallery coords
                this.$refs.map.setView([39.999696,-105.090894])
                this.$refs.map.clearDots()
            } else {
                this.$refs.mapcover.style.display = "none"
            }
        },
        // -----------------------
        // picking view devices
        // -----------------------
        updateTargets:function(){
            if(this.pickedDNS){
                let c = habitat.clouds.find(c=>c.name==this.pickedDNS.domain)
                if(c){
                    let p = habitat.getObj2DPos(c)
                    targ.cloud.x = p.x
                    targ.cloud.y = p.y
                    targ.cloud.draw()
                } else {
                    targ.cloud.clear()
                    this.clearDomains()
                    this.pickedDNS = null
                }
            } else {
                targ.cloud.clear()
            }
            if(this.pickedDev){
                let b = habitat.butterflies.find(b=>b.mac===this.pickedDev.mac)
                if(b){
                    let p = habitat.getObj2DPos(b.mesh)
                    targ.butterfly.x = p.x
                    targ.butterfly.y = p.y
                    targ.butterfly.color = this.pickedDev.color
                    targ.butterfly.draw()
                } else {
                    targ.butterfly.clear()
                    this.pickedDev = null
                }
            } else {
                targ.butterfly.clear()
            }
            if(this.pickedNet){
                let f = habitat.flowers.find(f=>f.name===this.pickedNet.mac)
                if(f){
                    let p = habitat.getObj2DPos(f,'flower')
                    targ.flower.x = p.x
                    targ.flower.y = p.y
                    targ.flower.color = this.pickedNet.color
                    targ.flower.draw()
                } else {
                    targ.flower.clear()
                    this.pickedNet = null
                }
            } else {
                targ.flower.clear()
            }
        },
        pickCloud:function(){
            if(this.domains.length > 0){
                this.curDNSIdx++
                if( this.curDNSIdx >= this.domains.length ) this.curDNSIdx=0
                this.pickedDNS = this.domains[this.curDNSIdx]
            } else {
                this.curDNSIdx = -1
                this.pickedDNS = null
            }
        },
        pickDevice:function(){
            // order by probes list
            let ordered = []
            for( let m in this.stations ) ordered.push( this.stations[m] )
            ordered.sort((a,b)=>b.probes.length-a.probes.length)

            // pick optimal device
            let pick
            for (let i = 0; i < ordered.length; i++) {
                if( this.prevDevs.indexOf(ordered[i].mac) < 0){
                    pick = ordered[i].mac
                    break
                }
            }
            if( typeof pick == "undefined" ){
                pick = ordered[Math.floor(Math.random()*ordered.length)].mac
            }

            return pick
        },
        pickNetwork:function(){
            // sort networks by associated clients length
            // first item is network's mac (rest are clients mac)
            let ordered = Object.keys(this.networks).map(m=>{
                let n = this.networks[m]
                let arr = [m, ...n.clients]
                return arr
            }).sort((a,b)=>b.length-a.length)

            // pick optimal network
            let pick
            for(let i = 0; i < ordered.length; i++){
                if(this.prevNets.indexOf(ordered[i][0]) < 0){
                    pick = ordered[i][0]
                    break
                }
            }
            if( typeof pick == "undefined" ){
                pick = ordered[Math.floor(Math.random()*ordered.length)][0]
            }
            return pick
        },
        pushMax(arr,val,max){
            if(arr.length > max) arr.shift()
            arr.push(val)
            return arr
        },
        tickDNS:function(time){
            setTimeout(()=>{ this.tickDNS(time) },time)
            // choose cloud
            this.pickCloud()
        },
        tickDev:function(time){
            setTimeout(()=>{ this.tickDev(time) },time)

            // choose butterfly
            if( Object.keys(this.stations).length > 0 ){
                let mac = this.pickDevice()
                this.pickedDev = Object.assign({},this.stations[mac])
                this.prevDevs = this.pushMax(this.prevDevs,mac,20)
                // set color
                let macArr= mac.split(':')
                this.pickedDev.color = `#${macArr[0]}${macArr[1]}${macArr[2]}`
                this.pickedDev.seen = this.printSeen(
                    this.pickedDev.firstSeen, this.pickedDev.lastSeen)
                // lookup map Data
                this.showDataFor(mac)
            } else {
                this.pickedDev = null
            }
        },
        tickNet:function(time){
            setTimeout(()=>{ this.tickNet(time) },time)

            // choose flower
            if( Object.keys(this.networks).length > 0){
                let mac = this.pickNetwork()
                this.pickedNet = Object.assign({},this.networks[mac])
                this.prevNets = this.pushMax(this.prevNets,mac,20)
                // set color
                let macArr = mac.split(':')
                this.pickedNet.color = `#${macArr[0]}${macArr[1]}${macArr[2]}`
                this.pickedNet.seen = this.printSeen(
                    this.pickedNet.firstSeen, this.pickedNet.lastSeen)
            } else {
                this.pickedNet = null
            }
        }
    }
})
