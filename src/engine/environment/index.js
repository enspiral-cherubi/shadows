const THREE = require('three')
const $ = require('jquery')
const OrbitControls = require('three-orbit-controls')(THREE)
const FlyControls = require('three-fly-controls')(THREE)
const WindowResize = require('three-window-resize')
const dat = require('dat.gui')
var randomHexColor = require('random-hex-color')

class Environment {

  constructor () {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
    this.camera.position.z = 0
    this.camera.position.x = 0
    this.camera.position.y = 20


    this.renderer = new THREE.WebGLRenderer({alpha: true, canvas: $('#three-canvas')[0]})
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.shadowMap.enabled = true
    // this.renderer.shadowMap.renderReverseSided = false


    // this.controls = new OrbitControls(this.camera)
    this.controls = new THREE.FlyControls(this.camera, this.renderer.domElement)
    this.controls.movementSpeed = 0.1
    this.controls.rollSpeed = 0.01
    this.keyMap = {}

    const windowResize = new WindowResize(this.renderer, this.camera)

    this.gui = new dat.GUI()
    var options = this.gui.addFolder('options')
    this.progress = true
    this.wireframes = false
    this.framesOff = false
    this.reverse = true
    options.add(this, 'progress').listen()
    options.add(this, 'wireframes').listen()
    options.add(this, 'reverse').listen()
    options.open()

    this.clock = new THREE.Clock()
    this.clock.start()
    this.timeShift = 0

    var floorGeometry = new THREE.PlaneGeometry(400 , 400, 32 )
    floorGeometry.lookAt(new THREE.Vector3(0,1,0))
    floorGeometry.translate(0,-10.1,0)
    var floorMaterial = new THREE.MeshToonMaterial( {color: 0xaaaaaa,side:THREE.DoubleSide,shadowSide:THREE.DoubleSide} )
    var floorMesh = new THREE.Mesh( floorGeometry, floorMaterial )
    floorMesh.receiveShadow = true
    floorMesh.castShadow = true
    this.scene.add( floorMesh )

    var floorGeometry2 = new THREE.PlaneGeometry(400 , 400, 32 )
    floorGeometry2.lookAt(new THREE.Vector3(0,1,0))
    floorGeometry2.translate(0,-10.2,0)
    var floorMaterial2 = new THREE.MeshToonMaterial( {color: 0xaaaaaa,side:THREE.DoubleSide} )
    var floorMesh2 = new THREE.Mesh( floorGeometry2, floorMaterial2 )
    floorMesh2.receiveShadow = true
    floorMesh2.castShadow = true
    this.scene.add( floorMesh2 )

    this.sunsetDistance = 200
    this.numLights = 3
    var orbGeometry = new THREE.SphereGeometry(10,32,32)
    this.lights = []
    for(var i = 0; i < this.numLights; i++){
      var color = randomHexColor()
      var light = new THREE.PointLight( color, 1, 200000,2)
      light.position.set( 0, 0, this.sunsetDistance )
      this.scene.add( light )
      this.lights.push(light)
      light.index = i+1
      light.castShadow = true
      var orbMaterial = new THREE.MeshBasicMaterial({shadowSide:null,color:color})
      var orbMesh = new THREE.Mesh(orbGeometry,orbMaterial)
      light.orb = orbMesh
      this.scene.add(orbMesh)
    }

    this.camera.lookAt(this.lights[0].position)

    this.popped = false
    this.addCube()
    this.createCity()
  }

  render () {
    var t = (this.clock.getElapsedTime() + this.timeShift)/40
    //
    // if(this.progress){
    //   this.cube.rotation.x+=0.01
    //   this.cube.rotation.y+=0.01
    // }

    if(this.progress){
      if(!this.clock.running){
        this.timeShift += this.clock.getElapsedTime()
        console.log(this.timeShift)
        this.clock.start()
      }
      this.lights.forEach((light) => {
        light.position.y = 100*Math.sin(light.index*t*(2*Number(this.reverse)-1))-11
        light.position.z = 1.75*this.sunsetDistance*(Math.cos(light.index*t*(2*Number(this.reverse)-1))+1)
        light.orb.position.set(light.position.x,light.position.y,light.position.z)
        if(light.position.y<-11){
          light.intensity = 0
        } else {
          light.intensity = 1
        }
      })
    }
    else {
      if (this.clock.running){
        this.clock.stop()
      }
    }

    if(!(this.wireframes) && !(this.framesOff)){
      this.wireframeMeshes.forEach((mesh) => {
        mesh.visible = false
      })
      this.framesOff = true
    }
    if(this.wireframes && this.framesOff){
      this.wireframeMeshes.forEach((mesh) => {
        mesh.visible = true
      })
      this.framesOff = false
    }



    // this.light.position.x+=0.01

    this.cube.rotation.x+=0.01
    this.cube.rotation.y+=0.011

    if(!this.popped && this.camera.position.distanceTo(this.cube.position) < 10){
      console.log(randomHexColor())
      this.lights.forEach((light) => {light.color.set(randomHexColor())})
      this.cube.translateX(100*Math.random())
      this.cube.translateY(100*Math.random())
      this.camera.lookAt(this.cube.position)
    }

    this.renderer.render(this.scene, this.camera)

  }

  // 'private'

  addCube() {
    var geometry = new THREE.BoxGeometry(2,2,2)
    var material = new THREE.MeshNormalMaterial()
    this.cube = new THREE.Mesh(geometry,material)
    this.scene.add(this.cube)
  }

  createCity() {
    var number = 5000
    var height = 20
    var width = 1
    var spread = 200

    //create locations
    var positions = []
    var x = 0
    var z = 0
    for(var i = 0; i < number; i++){
      z = Math.random()*spread
      x = (Math.random()-0.5)*spread*(1+(z/spread)*2)
      positions.push([x,z])
    }


    //build meshes
    this.wireframeMeshes = []
    var material = new THREE.MeshToonMaterial()
    var nightMaterial = new THREE.MeshBasicMaterial({wireframe:true, color:0x22457d})
    var h = 0
    positions.forEach((p) => {
      h = Math.random()*height
      var geometry = new THREE.BoxGeometry(width,h,width)
      geometry.translate(p[0],-10+h/2,p[1])
      var mesh = new THREE.Mesh(geometry,material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      var mesh2 = new THREE.Mesh(geometry,nightMaterial)
      this.wireframeMeshes.push(mesh2)
      this.scene.add(mesh2)
    })

  }



}

module.exports = Environment
