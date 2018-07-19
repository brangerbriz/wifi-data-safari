Vue.component('map-frame', {
    props:{
        DataZoom:{type:String,default:'true'},
        DataCred:{type:String,default:'true'}
    },
    data:function(){return {
        map:null,
        mapData:{
            // defaultLoc:[34.175978,-118.849112], // Thousand Oaks Museum
            // defaultLoc:[39.999696,-105.090894], // the Collective, CO
            // defaultLoc:[41.887349,-87.677997], // Branger_Briz, Chicago
            defaultLoc:[40.7498, -73.9906], // Hotel Pennsylvania, HOPE 2018, NYC
            t:0,
            tiles:[
				`http://${location.host}/map/tiles/nyc_40.7265_-73.9946_30km_zoom_0-17/{z}/{x}/{y}.png`,
                'http://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                'http://a.tile.stamen.com/toner/{z}/{x}/{y}.png'
            ],
            tileLayer:null,
            nets:[] // networks to be visualized (based on probes)
        }
    }},
    mounted:function(){
        // create the map
        this.map = L.map('map-inside-this-template',{
            zoomControl:(this.DataZoom=='true')
        }).setView(this.mapData.defaultLoc, 13)
		  .setMaxZoom(17)

        // this will trigger setView() once ipinfo is returned
        // leaving this commented out for Thousand Oaks Museum
        // socket.emit('get-ipinfo')

        this.mapData.tileLayer = L.tileLayer(
            this.mapData.tiles[this.mapData.t],{
            attribution:(this.DataCred=='true') ?
                '&copy; OpenStreetMap contributors' : ''
        }).addTo(this.map)

        // for Thousand Oaks Museum marker
        // L.marker([34.175978,-118.849112]).addTo(this.map)
            // .bindPopup('California Museum of Art Thousand Oaks').openPopup()
    },
    methods:{
        updateNetList:function(nets){
            this.mapData.nets = nets
        },
        switchMap:function(){
            this.mapData.t++
            if( this.mapData.t >= this.mapData.tiles.length ) this.mapData.t=0
            this.mapData.tileLayer.setUrl(this.mapData.tiles[this.mapData.t])
        },
        setView:function(gps){
            if(typeof gps=='string'){
                let loc = JSON.parse(gps).loc.split(',')
                if(this.map) this.map.setView([loc[0],loc[1]])
                else setTimeout(()=>{this.setView(gps)},1000)
            } else if( gps instanceof Array) {
                this.map.setView(gps)
            } else {
                this.map.setView([gps.lan,gps.lon])
            }
        },
        clearDots:function(){
            this.map.eachLayer((layer)=>{
                if(layer.options.color) this.map.removeLayer(layer)
            })
        },
        drawDots:function(d,clrMap){
            let opac = (d.rank>=100) ? 0.25 : 1-(d.rank/125)
            // console.log('dot',d.ssid,d.rank,opac)
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
            // console.log(data)

            // clear previous markers
            this.clearDots()

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
                let cap = 100 // don't draw networks if there's more than this
                data.forEach(d=>{
                    if( d.rank < cap ) this.drawDots(d,clrMap)
                })

                // re-center map
                if( clist.length <= 1 ){ // re-center to most unique network
                    this.map.setView([uni.lat,uni.lon])
                } else if( clist.length == 2 ){ // re-center between 2 points
                    this.map.fitBounds( L.polyline(clist).getBounds() )
                } else if( clist.length > 2) {// draw zone w/turf && re-center
                    this.map.fitBounds(polyline.getBounds())
                }
                // console.log('clist',clist)
                // console.log('uni',uni)

            } else {
                consloe.log('no wigle data to draw')
            }
        }
    },
    template:`<div id="map-inside-this-template"></div>`
})
