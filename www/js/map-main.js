const socket = io(`http://${window.location.host}`)
socket.on('init-data',d=>mapapp.init(d))
socket.on('ipinfo',gps=>mapapp.setView(gps))
socket.on('wigle-data',w=>mapapp.drawData(w.device,w.data))
socket.on('stations',(ss)=>{ ss.forEach((s)=>mapapp.add(s)) })

const mapapp = new Vue({
    el: '#mapapp',
    data: {
        map:null,
        mapData:{
            // using Thousand Oaks Museum Coords as default
            defaultLoc:[34.175978,-118.849112],
            t:0,
            tiles:[
                'http://a.tile.stamen.com/toner/{z}/{x}/{y}.png',
                'http://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
            ],
            tileLayer:null,
            nets:[] // networks to be visualized (based on probes)
        },
        stations:{},
        orderedDevices:[]
    },
    mounted:function(){
        // calls init() to load all previous data from CSV on server
        socket.emit('get-init-data')

        // create the map
        this.map = L.map('map').setView(this.mapData.defaultLoc, 13)

        // this will trigger setView() once ipinfo is returned
        // leaving this commented out for Thousand Oaks Museum
        // socket.emit('get-ipinfo')

        this.mapData.tileLayer = L.tileLayer(
            this.mapData.tiles[this.mapData.t],
            { attribution:'&copy; OpenStreetMap contributors' }
        ).addTo(this.map)

        // for Thousand Oaks Museum marker
        L.marker([34.175978,-118.849112]).addTo(this.map)
            .bindPopup('California Museum of Art Thousand Oaks').openPopup()
    },
    methods:{
        init:function(data){
            data.forEach((dev)=>this.add(dev))
        },
        add:function(n){
            if( this.stations.hasOwnProperty(n.mac) )
                this.stations[n.mac] = Object.assign(this.stations[n.mac],n)
            else
                this.stations[n.mac] = Object.assign({},n)
            // create ordered && filtered Array
            this.orderedDevices = Object.keys(this.stations)
                            .map((mac)=>this.stations[mac])
                            .filter(dev=>dev.probes.length>0)
                            .sort((a,b)=>b.probes.length-a.probes.length)
        },
        switchMap:function(){
            this.mapData.t++
            if( this.mapData.t >= this.mapData.tiles.length ) this.mapData.t=0
            this.mapData.tileLayer.setUrl(this.mapData.tiles[this.mapData.t])
        },
        getCurGPS:function(){
            console.log('ran getCurGPS')
            socket.emit('get-ipinfo')
        },
        setView:function(gps){
            let loc = JSON.parse(gps).loc.split(',')
            console.log(loc)
            if(this.map) this.map.setView([loc[0],loc[1]])
            else setTimeout(()=>{this.setView(gps)},1000)
        },
        showDataFor:function(mac){
            console.log(this.stations[mac].probes)
            this.mapData.nets = this.stations[mac].probes
            socket.emit('get-wigle-data',this.stations[mac])
        },
        // ---------------------[ markers ]-------------------------------------
        // -------------------- DRAW  LOGIC ------------------------------------
        // ---------------------[ markers ]-------------------------------------
        drawDots:function(d,clrMap){
            let opac = (d.rank>=100) ? 0.25 : 1-(d.rank/125)
            console.log(d.ssid,d.rank,opac)
            let clr = `hsl(${clrMap[d.ssid]}, 75%,50%)`
            let date = new Date(d.date).toDateString()
            let str = `<b>${d.ssid}</b><br><i>spotted on ${date}</i>`
            L.circleMarker([d.lat,d.lon],
                {"stroke":false,"color":clr,"fillOpacity":opac})
                .setRadius(10)
                .addTo(this.map)
                .bindPopup(str)
                .on("click",function(e){this.openPopup()})
        },
        drawZone:function(clist){
            // uses http://turfjs.org/
            let pts = turf.featureCollection(clist.map(p=>turf.point(p)))
            let convex = turf.convex(pts).geometry.coordinates[0]
            let polyline = L.polygon(convex,
                {color:'rgba(255,0,0,0.5)',stroke:false})
                            .addTo(this.map)
            return polyline
        },
        drawData:function(device,data){
            console.log(data)
            // clear previous markers
            this.map.eachLayer((layer)=>{
                if(layer.options.color) this.map.removeLayer(layer)
            })

            if(data.length > 0){

                let clist = []    // networks we're more "confident" about
                let uni = data[0] // most unique network
                data.forEach((d)=>{
                    if(d.rank <= 10) clist.push([d.lat,d.lon])
                    if(d.rank < uni.rank) uni = d
                })

                // create hue color map, network-names:hue-values
                let clrMap = {}
                this.mapData.nets.filter((d)=>{
                    // filter out probes not in wigle
                    let isInWigleData = false
                    for(let i=0; i<data.length; i++){
                        if(data[i].ssid==d){ isInWigleData = true; break }
                    }
                    return isInWigleData
                }).forEach((n,i)=>{
                    // assign hue-values to networks
                    clrMap[n] = (360/this.mapData.nets.length)*i
                })

                // draw zone
                let polyline
                if( clist.length > 2 ){ polyline = this.drawZone(clist) }

                // draw dots
                data.forEach(d=>this.drawDots(d,clrMap))

                // re-center map
                console.log('clist',clist)
                console.log('uni',uni)
                if( clist.length <= 1 ){ // re-center to most unique network
                    this.map.setView([uni.lat,uni.lon])
                } else if( clist.length == 2 ){ // re-center between 2 points
                    this.map.fitBounds( L.polyline(clist).getBounds() )
                } else if( clist.length > 2) {// draw zone w/turf && re-center
                    this.map.fitBounds(polyline.getBounds())
                }

            } else {
                // alert('no wigle data')
                this.stations[device].flagged = true
                this.$forceUpdate()
            }
        }
    }
})
