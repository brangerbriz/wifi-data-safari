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
        this.butterflies = []
        this.bgColor = (c && c.bgColor) ? c.bgColor : 0xffffff
        this.fog = (c && c.fog) ? c.fog : false
        this.worldSize = (c && c.worldSize) ? c.worldSize : [1000, 1000, 800]
        this.debug = (c && c.debug) ? c.debug : false
        this.test = (c && c.test) ? c.test : false
    }

    createTestButterflies( num ){
        function genMAC(){
            var hexDigits = "0123456789ABCDEF";
            var macAddress = "";
            for (var i = 0; i < 6; i++) {
                macAddress+=hexDigits.charAt(Math.round(Math.random() * 15));
                macAddress+=hexDigits.charAt(Math.round(Math.random() * 15));
                if (i != 5) macAddress += ":";
            }
            return macAddress;
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

    ran(min,max,floor){
        let val = (max) ? Math.random()*(max-min)+min : Math.random()*min
        if(floor) return Math.floor(val)
        else return val
    }

    addButterfly(dev){
        let ranMask = `images/mask${this.ran(0,4,true)}.jpg`
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

    winResize(){
        this.camera.aspect = innerWidth/innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize( innerWidth, innerHeight )
    }

    setupScene(){
        // camera
        this.camera = new THREE.PerspectiveCamera(
            75, innerWidth/innerHeight, 1, 10000 )
        this.camera.position.z = this.worldSize[2]/2

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
            this.worldSize[2] - this.worldSize[2]/4,
            this.worldSize[2]
        )

        // ground
        let gndMesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry( 20000, 20000 ),
            new THREE.MeshBasicMaterial({color:'#003300'})
        );
        gndMesh.position.y = -this.worldSize[1]/2
        gndMesh.rotation.x = -Math.PI/2
        gndMesh.receiveShadow = true
        this.scene.add( gndMesh )

        // dom stuffs
        let css = 'position: fixed; top:0px; left:0px; z-index: -1;'
        this.renderer.domElement.style.cssText = css
        document.body.appendChild( this.renderer.domElement )
        window.addEventListener( 'resize', ()=>{
            this.winResize()
        }, false )

        // debug utils
        if( this.debug ){
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
            // mouse orbit camera controls
            this.cntrl = new THREE.OrbitControls(
                this.camera, this.renderer.domElement )
            this.cntrl.maxPolarAngle = Math.PI * 0.5
        }

        // test butterflies...
        if( this.test ) this.createTestButterflies(this.test)
    }

    drawScene(){
        requestAnimationFrame(()=>{
            this.drawScene()
        })

        if( this.debug ) this.stats.update()

        // update butterflies
        this.butterflies.forEach((butterfly)=>{
            butterfly.boid.run( this.butterflies.map((b)=>b.boid) )
            butterfly.mesh.update( butterfly.boid )
        })

        this.renderer.render( this.scene, this.camera )
    }
}
