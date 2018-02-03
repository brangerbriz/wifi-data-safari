/*
    this Habitat class requires three.js, boid.js && butterfly.js
    stats.min.js && OrbitControls.js are required for debug option

    ----------------------------
    example
    ----------------------------
    const habitat = new Habitat({
        debug:true,
        test:500,
        fog: true,
        bgColor:'#cce0ff',
        worldSize:[1000, 800, 800]
    })

    ----------------------------
    config object options
    ----------------------------
    debug:[boolean] show stats, world bounding box && add mouse orbit controls
    test:[number] of test butterflies to create
    fog:[boolean] show fog
    bgColor:[string] color of sky/fog background
    worldSize:[array] [x,y,z] bounding box for boids to fly inside of,
        the ground position && fog position are calculated from worldSize

    ----------------------------
    TODO
    ----------------------------
    * networks/flowers
    * associated stations/butterfly logic
    * better habitat/world environment design
    * figure out new info/target/data/hud

*/
class Habitat {
    constructor( c ){
        this.camera = null
        this.scene = null
        this.renderer = null
        // meshes && such
        this.gndMesh = null
        this.gndHeights = []
        this.butterflies = []
        // options
        this.bgColor = (c && c.bgColor) ? c.bgColor : 0xffffff
        this.fog = (c && c.fog) ? c.fog : false
        this.worldSize = (c && c.worldSize) ? c.worldSize : [1000, 1000, 800]
        this.debug = (c && c.debug) ? c.debug : false
        this.test = (c && c.test) ? c.test : false
    }

    ran(min,max,floor){
        let val = (max) ? Math.random()*(max-min)+min : Math.random()*min
        if(floor) return Math.floor(val)
        else return val
    }

    createTestButterflies( num ){
        let self = this
        function genMAC(){
            var hexDigits = "0123456789ABCDEF"
            var macAddress = ""
            for (var i = 0; i < 6; i++) {
                macAddress+=hexDigits.charAt(self.ran(0,15,true))
                macAddress+=hexDigits.charAt(self.ran(0,15,true))
                if (i != 5) macAddress += ":"
            }
            return macAddress
        }
        for ( var i = 0; i < num; i ++ ) {
            let dev = {
                "mac": genMAC(),
                "firstSeen": "2017-12-15 16:01:08",
                "lastSeen": "2017-12-15 16:01:08",
                "power": -89,
                "packets": 1,
                "network": "84:00:2D:62:8A:DB",
                "probes": [],
                "type":"station",
                "vendor":"Apple"
            }
            this.addButterfly(dev)
        }
    }

    addButterfly(dev){
        let ranMask = `images/mask${this.ran(0,4,true)}.jpg`
        // let material = new THREE.MeshLambertMaterial({
        let material = new THREE.MeshBasicMaterial({
            flatShading: true,
            color: 0x000000,
            side: THREE.DoubleSide,
            alphaMap:new THREE.TextureLoader().load(ranMask),
            alphaTest: 0.5
        })
        // create butterfly object
        let b = {
            mac:dev.mac,
            boid: new Boid(),
            mesh: new THREE.Mesh(new Butterfly(), material )
        }
        // set boid details
        b.boid.velocity.set(this.ran(-1,1),this.ran(-1,1),this.ran(-1,1))
        // b.boid.position.set(0,this.ran(-25,25),this.ran(-100,100))
        b.boid.setAvoidWalls( true )
        b.boid.setWorldSize( ...this.worldSize.map((n)=>n/2) )
        // set mesh details
        b.mesh.material.color.r = parseInt(dev.mac.split(':')[0],16)/255
        b.mesh.material.color.g = parseInt(dev.mac.split(':')[1],16)/255
        b.mesh.material.color.b = parseInt(dev.mac.split(':')[2],16)/255
        b.mesh.original = {
            r:b.mesh.material.color.r,
            g:b.mesh.material.color.g,
            b:b.mesh.material.color.b
        }
        b.mesh.phase = this.ran(0,62.83,true)
        b.mesh.mac = b.mac
        b.mesh.update = function( b ){
            this.position.copy( b.position )
            this.geometry.verticesNeedUpdate = true
            this.rotation.y = Math.atan2(-b.velocity.z, b.velocity.x)
            this.rotation.z = Math.asin(b.velocity.y/b.velocity.length())
            this.phase=(this.phase+(Math.max(0,this.rotation.z)+0.3))%62.83
            this.geometry.vertices[ 0 ].y =
                this.geometry.vertices[ 1 ].y = 6 * Math.cos( this.phase )
            this.geometry.vertices[ 5 ].y =
                this.geometry.vertices[ 4 ].y = 6 * Math.sin( this.phase )
            this.geometry.vertices[ 0 ].z =
                this.geometry.vertices[ 1 ].z = 6 * Math.sin( this.phase )
            this.geometry.vertices[ 5 ].z =
                this.geometry.vertices[ 4 ].z = 6 * Math.cos( this.phase )
        }
        // add mesh to scene && butterfly object to array
        this.scene.add( b.mesh )
        this.butterflies.push( b )
    }

    addFlower(){
        function onError(e){ console.log('there was an error') }
        function onProgress(xhr){
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
        }

        let buffloader = new THREE.BufferGeometryLoader()
        buffloader.load('js/sunflower.json',(geometry)=>{
            let materials = [
                new THREE.MeshPhongMaterial({color:'#7c5106'}),
                new THREE.MeshPhongMaterial({color:'#efe864'}), //TODO MAC color
                new THREE.MeshPhongMaterial({color:'#b1f49f'})
            ]
            let material = new THREE.MeshFaceMaterial(materials)
            this.flower = new THREE.Mesh( geometry, material )
            this.flower.geometry.scale(100,100,100)
            this.flower.position.y = -this.worldSize[1]*0.25
            this.scene.add( this.flower )

            // assign groups with  corresponding  materialIndex
            let group = 0
            let fileloader = new THREE.FileLoader()
            fileloader.load('js/sunflower-groups.json',(jsonString)=>{
                let data = JSON.parse(jsonString)
                for (let part in data) {
                    data[part].start.forEach((s,i)=>{
                        let idx
                        switch(part){
                            case 'seeds': idx=0;break;
                            case 'pedals': idx=1;break;
                            case 'stem': idx=2;break;
                            case 'leaf1': idx=2;break;
                            case 'leaf2': idx=2;break;
                            case 'leaf3': idx=2;break;
                        }
                        this.flower.geometry.groups[group] = {
                            start:data[part].start[i],
                            count:data[part].count[i],
                            materialIndex:idx
                        }
                        group++
                    })
                }


            }/*,onProgress,onError*/) // for debug

            // morph...
            // for(let i=0; i<this.flower.geometry.index.count; i++){
            //     let x = this.ran(0,100)
            //     let y = this.ran(0,100)
            //     let z = this.ran(0,100)
            //     this.flower.geometry.attributes.position.setXYZ( i,x,y,z )
            //     this.flower.geometry.attributes.position.needsUpdate = true
            // }
        }/*,onProgress,onError*/) // for debug

        // TODO
        // rather than global .flower, make these like butterflies
        // tween when appear, this.flower.scale.y = 1
        // randomly decide how many of the 3 leaves to draw
        // assign pedal color based on MAC
    }

    createGnd(){
        let elevation = 50
        this.gndMesh = new THREE.Mesh(
            new THREE.PlaneGeometry( 4000, 4000, 40, 40 ),
            new THREE.MeshLambertMaterial({color:'#b1f49f'})
            // new THREE.MeshNormalMaterial()
        )

        for (let i = 0; i < this.gndMesh.geometry.vertices.length; i++) {
          this.gndHeights[i] = this.ran(0,elevation)
          this.gndMesh.geometry.vertices[i].z = this.gndHeights[i]
        }

        this.gndMesh.geometry.computeFlatVertexNormals()
        this.gndMesh.position.y = -(elevation + this.worldSize[1]/2)
        this.gndMesh.rotation.x = -Math.PI/2
        this.scene.add( this.gndMesh )
    }

    createDebugHelpers(spotLight){
        // fps/ms stats
        this.stats = new Stats()
        let statsCSS = 'position:absolute; right:0px; top:0px'
        this.stats.domElement.style.cssText = statsCSS
        document.body.appendChild(this.stats.domElement)
        // boid worldSize bounding box
        let geometry = new THREE.BoxGeometry( ...this.worldSize )
        let material = new THREE.MeshBasicMaterial({
            color:'#00FFFF', wireframe:true
        })
        this.boundingBox = new THREE.Mesh( geometry, material )
        this.scene.add( this.boundingBox )
        // spot light helper
        // this.lightHelper = new THREE.SpotLightHelper( spotLight, 0xffff00 )
        // this.scene.add( this.lightHelper )
        // mouse orbit camera controls
        this.cntrl=new THREE.OrbitControls(this.camera,this.renderer.domElement)
        // this.cntrl.maxPolarAngle = Math.PI * 0.5
        this.camera.position.set(0,-200,400)
        this.camera.rotation.set(0.3,0,0)
    }

    winResize(){
        this.camera.aspect = innerWidth/innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize( innerWidth, innerHeight )
    }

    setupScene(){
        // camera
        this.camera = new THREE.PerspectiveCamera(
            50, innerWidth/innerHeight, 1, 10000 )
        this.camera.position.set(0, -200, this.worldSize[2]/2)
        this.camera.rotation.set(0.25, 0, 0)

        // renderer
        this.renderer = new THREE.WebGLRenderer()
        // this.renderer.setClearColor( this.bgColor )
        this.renderer.setPixelRatio( window.devicePixelRatio )
        this.renderer.setSize( innerWidth, innerHeight )
        this.renderer.autoClear = true

        // scene
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color( this.bgColor )
        if(this.fog) this.scene.fog = new THREE.Fog(
            this.bgColor,
            this.worldSize[2] - this.worldSize[2]/8,
            this.worldSize[2]*2
        )

        // lights
        this.scene.add( new THREE.AmbientLight(0xffffff, 0.3) )
        let light = new THREE.DirectionalLight(0xffffff, 0.3)
            light.position.set(0, 2000, 2800)
        this.scene.add(light)
        let light2 = new THREE.DirectionalLight(0xffffff, 0.1)
            light2.position.set(0, 2000, -2800)
        this.scene.add(light2)
        // SpotLight( color, intensity, distance, angle, penumbra, decay )
        // let spotLight = new THREE.SpotLight(0xffffff,20,2000,Math.PI/5,0.05,2)
            // spotLight.position.set(0, 1500, 0)
        // this.scene.add(spotLight)  TODO to spotLight or not to spotLight

        // testing addFlower
        this.addFlower()

        // ground
        this.createGnd()

        // debug utils
        if( this.debug ) this.createDebugHelpers(/*spotLight*/)

        // test butterflies...
        if( this.test ) this.createTestButterflies(this.test)

        // dom stuffs
        let css = 'position: fixed; top:0px; left:0px; z-index: -1;'
        this.renderer.domElement.style.cssText = css
        document.body.appendChild( this.renderer.domElement )
        window.addEventListener( 'resize', ()=>{
            this.winResize()
        }, false )
    }

    drawScene(){
        requestAnimationFrame(()=>{
            this.drawScene()
        })

        if( this.debug ){
            this.stats.update()
            // this.lightHelper.update()
        }

        // update butterflies
        this.butterflies.forEach((butterfly)=>{
            butterfly.boid.run( this.butterflies.map((b)=>b.boid) )
            butterfly.mesh.update( butterfly.boid )
        })

        this.renderer.render( this.scene, this.camera )
    }
}
