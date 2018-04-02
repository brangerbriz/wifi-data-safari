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
    * associated stations/butterfly logic
    * better habitat/world environment design
    * figure out new info/target/data/hud

*/
class Habitat {
    constructor( c ){
        this.camera = null
        this.scene = null
        this.renderer = null
        this.projector = new THREE.Projector()
        // meshes && such
        this.gndMesh = null
        this.elevation = 25
        this.gndHeights = []
        this.butterflies = []
        this.flowers = []
        this.clouds = []
        // options
        this.bgColor = (c && c.bgColor) ? c.bgColor : 0xffffff
        this.fog = (c && c.fog) ? c.fog : false
        this.worldSize = (c && c.worldSize) ? c.worldSize : [1000, 1000, 800]
        this.debug = (c && c.debug) ? c.debug : false
        this.test = (c && c.test) ? c.test : false
    }

    norm(value, min, max){ return (value - min) / (max - min) }

    lerp(norm, min, max){ return (max - min) * norm + min }

    map(value, sourceMin, sourceMax, destMin, destMax){
        return this.lerp(
            this.norm(value, sourceMin, sourceMax), destMin, destMax)
    }

    ran(min,max,floor){
        let val = (max) ? Math.random()*(max-min)+min : Math.random()*min
        if(floor) return Math.floor(val)
        else return val
    }

    getObj2DPos(obj){
        let p = new THREE.Vector3()
        p.setFromMatrixPosition( obj.matrixWorld )
        let v = this.projector.projectVector(p, this.camera)
        let percX = (v.x + 1) / 2
        let percY = (-v.y + 1) / 2
        let x = percX*window.innerWidth
        let y = percY*window.innerHeight
        return {x:x,y:y}
    }

    createTestButterflies( num ){
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
        let self = this
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
        b.mesh.flap = function(){
            this.geometry.verticesNeedUpdate = true
			this.phase=(this.phase + 0.3) % 62.83
            // this.position.x += Math.sin(this.phase)*10
            this.geometry.vertices[ 0 ].y = this.geometry.vertices[ 1 ].y =
                self.map(6 * Math.cos( this.phase ), -6,6, 1,6)
            this.geometry.vertices[ 5 ].y = this.geometry.vertices[ 4 ].y =
                self.map(6 * Math.sin( this.phase ), -6,6, 1,6)
            this.geometry.vertices[ 0 ].z = this.geometry.vertices[ 1 ].z =
                self.map(6 * Math.sin( this.phase ), -6,6, 1,6)
            this.geometry.vertices[ 5 ].z = this.geometry.vertices[ 4 ].z =
                self.map(6 * Math.cos( this.phase ), -6,6, 1,6)
        }

		b.mesh.flutter = function() {
			if (!this.flutterPhase) {
				this.flutterPhase = Math.random() * 0.003 + 0.003
			}
			this.geometry.verticesNeedUpdate = true
			this.position.y += Math.sin(Date.now() * this.flutterPhase) * 0.5
			// this.position.y += noise.perlin2(this.noiseDelta, 0) * 0.25
			this.position.x += Math.sin(Date.now() * this.flutterPhase) * 0.1

		}
        // add mesh to scene && butterfly object to array
        this.scene.add( b.mesh )
        this.butterflies.push( b )
    }

    placeButterflyOnFlower(b,f){
        // TODO
        let pos = Object.assign({},f.position)

		pos.x += this.ran(-25, 25)
		pos.y += this.ran(70, 100)
		pos.z += this.ran(20, 30)

		b.mesh.geometry.scale(2, 2, 2)
        b.mesh.position.copy(pos)
		b.mesh.geometry.rotateX(Math.random() * Math.PI)

    }

    updateAssoButterfly(devMac,netMac){
		let idx = this.butterflies.map(b=>b.mac).indexOf(devMac)
        if( idx >= 0 ){
            for (let i = 0; i < this.flowers.length; i++) {
                if( this.flowers[i].name == netMac &&
                    typeof this.butterflies[idx].net=="undefined"){
                    this.butterflies[idx].net = netMac
                    this.placeButterflyOnFlower(
                        this.butterflies[idx],this.flowers[i])
                    break
                }
            }
        }
    }

    addFlower(dev){
        function onError(e){ console.log('there was an error') }
        function onProgress(xhr){
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
        }

        let clr = [
            parseInt(dev.mac.split(':')[0],16),
            parseInt(dev.mac.split(':')[1],16),
            parseInt(dev.mac.split(':')[2],16)
        ]

        let sec = (dev.privacy=="OPN") ? 3 : 2

        let pos = []
		// x
		// pos[0] = this.map(parseInt(dev.mac.split(':')[5],16),
        //         0, 255, -this.worldSize[0] * 0.25, this.worldSize[0] * 0.25)
		pos[0] = this.ran(-this.worldSize[0] * 0.3, this.worldSize[0] * 0.3)

		// y
		pos[1] = -this.worldSize[1] / 2 - this.elevation - this.ran(0, 8)

		// z
		const nearZ = this.worldSize[2] * 5.5
		const farZ  = -this.worldSize[2] * 0.25
		const zOffset = -2000
		pos[2] = this.map(dev.power, -30, -100,  nearZ + zOffset, farZ + zOffset)
		// console.log(dev.power)
		// console.log(`power: ${dev.power} z: ${pos[2]}`)

        let buffloader = new THREE.BufferGeometryLoader()
        buffloader.load('js/sunflower.json',(geometry)=>{
            let materials = [
                new THREE.MeshPhongMaterial({color:'#7c5106'}),
                new THREE.MeshPhongMaterial({color:'rgb('+clr+')'}),
                new THREE.MeshPhongMaterial({color:'#b1f49f'})
                // index 3 is nothing, ie. make things disapear
            ]
            let material = new THREE.MeshFaceMaterial(materials)
            let flower = new THREE.Mesh( geometry, material )
                flower.geometry.scale(50,50,50)
                flower.position.set(...pos)
                flower.rotation.y = this.ran(-1,1)
                flower.name = dev.mac

            // assign groups with  corresponding  materialIndex
            let group = 0
            let fileloader = new THREE.FileLoader()
            fileloader.load('js/sunflower-groups.json',(jsonString)=>{
                let data = JSON.parse(jsonString)
                for (let part in data) {
                    data[part].start.forEach((s,i)=>{
                        let idx // index for material in materials array above
                        switch(part){
                            case 'seeds': idx=0;break;
                            case 'pedals': idx=1;break;
                            case 'stem': idx=2;break;
                            case 'leaf1': idx=sec;break;
                            case 'leaf2': idx=sec;break;
                            case 'leaf3': idx=sec;break;
                        }
                        flower.geometry.groups[group] = {
                            start:data[part].start[i],
                            count:data[part].count[i],
                            materialIndex:idx
                        }
                        group++
                    })
                }

                // if(this.flowers.length < 20){
                //NOTE: limiting flower amount for testing
                    flower.scale.y = 0
                    this.scene.add( flower )
                    this.flowers.push( flower )
                    new TWEEN.Tween(flower.scale)
                        .to({ x:1, y:1, z:1 }, 500)
                        .easing(TWEEN.Easing.Sinusoidal.Out)
                        .start()
                // }
            }/*,onProgress,onError*/) // for debug

            // morph...
            // for(let i=0; i<flower.geometry.index.count; i++){
            //     let v = [i,this.ran(0,100),this.ran(0,100),this.ran(0,100)]
            //     flower.geometry.attributes.position.setXYZ( ...v )
            //     flower.geometry.attributes.position.needsUpdate = true
            // }

        }/*,onProgress,onError*/) // for debug
    }

    addCloud(dnsRecord) {

        const manager = new THREE.LoadingManager()
		manager.onProgress = function (item, loaded, total) {
			// console.log(item, loaded, total)
		}

		var onProgress = function (xhr) {
			if ( xhr.lengthComputable ) {
				var percentComplete = xhr.loaded / xhr.total * 100;
				// console.log( Math.round(percentComplete, 2) + '% downloaded' )
			}
		}

		var onError = function (xhr) {
            console.log(xhr)
		}

		var loader = new THREE.OBJLoader(manager)
		loader.load(`js/Clouds_Separated/Cloud${this.ran(1, 4, true)}.obj`, cloud => {

			cloud.name = dnsRecord.domain
			cloud.blocked = dnsRecord.blocked

            const scale = this.ran(25, 50, true)
            cloud.scale.x = scale
            cloud.scale.y = scale
            cloud.scale.z = scale

			cloud.position.y = this.ran(0, 600)
            cloud.position.z = this.ran(0, -700)
            cloud.position.x = -1100

            const material = new THREE.MeshPhongMaterial({
                color: '#ffffff',
                emissive: '#555555',
                shininess: 0,
                flatShading: true,
				opacity: 0.5,
				transparent: true
            })

            cloud.traverse(child => {
				if (child instanceof THREE.Mesh) {
					child.material = material
				}
			})

            this.clouds.push(cloud)

            const speed = this.ran(50, 100, true) * 1000
            new TWEEN.Tween(cloud.position)
                .to({ x:1100, y:cloud.position.y, z:cloud.position.z }, speed)
				.easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth.
				.onComplete(() => {
					this.scene.remove(cloud)
					// remove the cloud from the clouds array
					for(let i = this.clouds.length - 1; i >= 0 ; i--){
						if(this.clouds[i].uuid == cloud.uuid){
							this.clouds.splice(i, 1)
						}
					}
				})
                .start()
				// tween scale over time to +/- 100% in each direction
				new TWEEN.Tween(cloud.scale)
	                .to({ x:cloud.scale.x * Math.random() * 2,
						  y:cloud.scale.y * Math.random() * 2,
						  z:cloud.scale.z * Math.random() * 2 }, speed)
					.easing(TWEEN.Easing.Linear.None) // Use an easing function to make the animation smooth.
	                .start()

            this.scene.add(cloud)

		}, onProgress, onError )

    }

    createGnd(){
        this.gndMesh = new THREE.Mesh(
            new THREE.PlaneGeometry( 4000, 4000, 100, 100 ),
            new THREE.MeshLambertMaterial({color:'#b1f49f'})
            // new THREE.MeshNormalMaterial()
        )

        for (let i = 0; i < this.gndMesh.geometry.vertices.length; i++) {
          this.gndHeights[i] = this.ran(0,this.elevation)
          this.gndMesh.geometry.vertices[i].z = this.gndHeights[i]
        }

        this.gndMesh.geometry.computeFlatVertexNormals()
        this.gndMesh.position.y = -(this.elevation + this.worldSize[1]/2)
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
        this.camera.position.set(0,-this.worldSize[1]/2.5,this.worldSize[1]/1.5)
        this.camera.rotation.set(0.18,0,0)
    }

    winResize(){
        this.camera.aspect = innerWidth/innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize( innerWidth, innerHeight )
    }

    setupScene(){

        for (let i = 0; i < 10; i++) {
            setTimeout(() => this.addCloud(Math.random()), this.ran(0, 5000))
        }

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
        //     spotLight.position.set(0, 1500, 0)
        // this.scene.add(spotLight)  //TODO to spotLight or not to spotLight

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

		this.winResize()
    }

    drawScene(callback){
        requestAnimationFrame(()=>{
            if(callback) this.drawScene(callback)
            else this.drawScene()
        })

        if( this.debug ){
            this.stats.update()
            // this.lightHelper.update()
        }

        // update butterflies
        this.butterflies.forEach((butterfly)=>{
            if( butterfly.net ){
				// be sure to flap before flutter so that phase is
				// updated correctly
                butterfly.mesh.flap()
				butterfly.mesh.flutter()
            } else {
                butterfly.boid.run( this.butterflies.map((b)=>b.boid) )
                butterfly.mesh.update( butterfly.boid )
            }
        })

        // update any flowers that need to spring up
        TWEEN.update()

        // call optional callback
        if(callback) callback()

        this.renderer.render( this.scene, this.camera )
    }

}
