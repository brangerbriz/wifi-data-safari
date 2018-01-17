const socket = io(`http://${window.location.host}`)
socket.on('init-data',d=>mapapp.init(d))
socket.on('ipinfo',gps=>mapapp.setView(gps))
socket.on('wigle-data',d=>mapapp.drawData(d))
socket.on('stations',(ss)=>{ ss.forEach((s)=>mapapp.add(s)) })

const mapapp = new Vue({
    el: '#mapapp',
    data: {
        map:null,
        mapData:{
            t:0,
            tiles:[
                'http://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                'http://a.tile.stamen.com/toner/{z}/{x}/{y}.png'
            ],
            rankedSSIDs:{},
            redPts:[],
            bluePts:[]
        },

        stations:{},
        orderedDevices:[]
    },
    mounted:function(){
        // calls init() to load all previous data from CSV on server
        socket.emit('get-init-data')

        // create the map - Thousand Oaks Museum Coords
        this.map = L.map('map').setView([34.175978,-118.849112], 13)

        // this will trigger setView() once ipinfo is returned
        // socket.emit('get-ipinfo')

        let opt = { attribution:'&copy; OpenStreetMap contributors' }
        L.tileLayer(this.mapData.tiles[this.mapData.t], opt).addTo(this.map)

        // for Thousand Oaks Museum marker
        L.marker([34.175978,-118.849112]).addTo(this.map)
            .bindPopup('California Museum of Art Thousand Oaks').openPopup()

        // this.map.setMaxBounds(new L.LatLngBounds(
        //     [25.558712, -80.427557], [26.022771, -79.993822]
        // ));
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
        setView:function(gps){
            let loc = JSON.parse(gps).loc.split(',')
            if(this.map) this.map.setView([loc[0],loc[1]])
            else setTimeout(()=>{this.setView(gps)},1000)
        },
        showDataFor:function(mac){
            console.log(this.stations[mac].probes)
            socket.emit('get-wigle-data',this.stations[mac])
        },
        drawData:function(data){
            console.log(data)
            data.forEach((d)=>{
                // if( d.rank > 10 && d.rank < 110 ){
                //     this.mapData.bluePts.push([d.lat,d.lon])
                // }
                L.circleMarker([d.lat,d.lon],{"color":"#E06667","fillOpacity":1})
                    .setRadius(7)
                    .addTo(this.map)
                    .bindPopup(d.ssid+"<br><i>"+d.date+"</i>*")
                    .on("mouseover",function(e){this.openPopup()})
            })
            // for (let i = 0; i < data.length; i++) {
            //     let x = gps_vectors[i].lat;
            //     let y = gps_vectors[i].lon;
            //     let ssid = gps_vectors[i].ssid;
            //     let date = parseDate( gps_vectors[i].date );
            //     if(ssid_ranks[gps_vectors[i].ssid] > 10 && ssid_ranks[gps_vectors[i].ssid] < 110 ){
            //         bluePts.push([x,y]);
            //         bssid.push(gps_vectors[i].ssid);
            //         bdates.push(date);
            //         total++;
            //     }
            //     else if(ssid_ranks[gps_vectors[i].ssid] <= 10) {
            //         redPts.push([x,y]);
            //         rssid.push(gps_vectors[i].ssid);
            //         rdates.push(date);
            //         total++;
            //         if(redSSIDs.indexOf(gps_vectors[i].ssid)==-1){
            //             redSSIDs.push(gps_vectors[i].ssid);
            //         }
            //     }
            // }
        }
    }
})
