import {
  ExtendedObject3D,
  PointerDrag,
  PointerLock,
  Scene3D,
  ThirdPersonControls,
} from '@enable3d/phaser-extension'
import * as THREE from 'three'

const isTouchDevice = 'ontouchstart' in window

export default class MainScene extends Scene3D {
  cams!: {
    ortho: THREE.OrthographicCamera
    perspective: THREE.OrthographicCamera | THREE.PerspectiveCamera
    active: string
    inTransition: boolean
    offset: null
  }
  terrace!: ExtendedObject3D
  player!: ExtendedObject3D

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension({ maxSubSteps: 10, fixedTimeStep: 1 / 120 })

    this.third.renderer.outputEncoding = THREE.LinearEncoding
  }

  preload() {}

  async create() {
    const { lights } = await this.third.warpSpeed('ground', '-orbitControls')
    // const intensity = 0.01

    // TODO: Fix this
    // const { ambientLight, directionalLight, hemisphereLight } = lights
    // hemisphereLight.intensity = 0.1
    // ambientLight.intensity = 0.01
    // directionalLight.intensity = 0.01

    const zoom = 20
    const w = this.cameras.main.width / zoom
    const h = this.cameras.main.height / zoom
    this.cams = {
      ortho: this.third.cameras.orthographicCamera({
        left: w / -2,
        right: w / 2,
        top: h / 2,
        bottom: h / -2,
      }),
      perspective: this.third.camera,
      active: 'perspective',
      inTransition: false,
      offset: null,
    }
    // set up scene (light, ground, grid, sky, orbitControls)
    // this.third.warpSpeed('-ground')

    // const camera = new THREE.PerspectiveCamera(
    //   35,
    //   window.innerWidth / window.innerHeight,
    //   2,
    //   5000,
    // )
    // camera.position.set(-100, 50, -50)
    // camera.lookAt(-50, 50, -30)
    // now modify the features (if needed)
    // const camera= this.warpSpeed('camera')
    //scene3D.orbitControls.target.set(0, 5, 0)

    // this.third.add.box({ x: 1, y: 2 })
    //this.third.physics.add.box({ x: 0, y: 4, z: 6 })
    // this.third.haveSomeFun()
    //this.third.physics.add.box({ y: 10, x: 35 }, { lambert: { color: 'red' } })

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    // additionally warpSpeed() returns the camera, ground, lights, orbitControls.
    // const { camera, lights, orbitControls } = await this.warpSpeed()

    //loading glb file
    // removing ground and orbital controls from the glb file
    // this.third.warpSpeed('ground', '-orbitControls')

    this.createTerraceGLB()
    this.createIdleGLB()
  }

  update() {}

  private createTerraceGLB() {
    this.third.load.gltf('/assets/glb/terrace2.glb').then((object) => {
      const scene = object.scenes[0]

      // Create terrace
      this.terrace = new ExtendedObject3D()
      this.terrace.name = 'scene'

      // Add it to the scene
      this.terrace.add(scene)
      this.third.add.existing(this.terrace)

      // add animations
      object.animations.forEach((anim, i) => {
        this.terrace.mixer = this.third.animationMixers.create(this.terrace)
        // overwrite the action to be an array of actions
        this.terrace.action = []
        this.terrace.action[i] = this.terrace.mixer.clipAction(anim)
        this.terrace.action[i].play()
      })

      this.terrace.traverse((child: any) => {
        if (!child.isMesh) {
          return
        }

        child.castShadow = child.receiveShadow = false
        child.material.metalness = 0
        child.material.roughness = 1

        if (/mesh/i.test(child.name)) {
          this.third.physics.add.existing(child, {
            shape: 'concave',
            mass: 0,
            collisionFlags: 1,
            autoCenter: false,
          })
          child.body.setAngularFactor(0, 0, 0)
          child.body.setLinearFactor(0, 0, 0)
        }
      })
    })
  }

  private createIdleGLB() {
    this.third.load.gltf('public/assets/glb/idle.glb').then((object) => {
      const scene = object.scenes[0]

      this.player = new ExtendedObject3D()
      this.player.name = 'scene'
      this.player.add(scene)
      this.third.add.existing(this.player)

      // Rotate the player
      this.player.rotateY(Math.PI + 0.1)
      this.player.rotation.set(0, Math.PI * 1.5, 0)
      this.player.position.set(-4.83, -0.18, 6.94)

      //add shadow
      this.player.traverse((child) => {
        if (!child.isMesh) {
          return
        }

        child.castShadow = child.receiveShadow = true
        child.material.roughness = 1
        child.material.metalness = 0
      })

      this.third.animationMixers.add(this.player.anims.mixer)
      object.animations.forEach((animation) => {
        if (animation.name) {
          this.player.anims.add(animation.name, animation)
        }
      })

      this.player.anims.play('idle')

      // Add the player to the scene with a body
      this.third.add.existing(this.player)
      this.third.physics.add.existing(this.player, {
        shape: 'sphere',
        radius: 0.25,
        width: 0.5,
        offset: { y: -0.25 },
      })
      this.player.body.setFriction(0.8)
      this.player.body.setAngularFactor(0, 0, 0)

      // https://docs.panda3d.org/1.10/python/programming/physics/bullet/ccd
      this.player.body.setCcdMotionThreshold(1e-7)
      this.player.body.setCcdSweptSphereRadius(0.25)

      const controls = new ThirdPersonControls(this.third.camera, this.player, {
        offset: new THREE.Vector3(0, 1, 0),
        targetRadius: 3,
      })

      // set initial view to 90 deg theta
      controls.theta = 90

      // Add Pointer Lock and Pointer Drag

      if (!isTouchDevice) {
        let pointerLock = new PointerLock(this.game.canvas)
        let pointerDrag = new PointerDrag(this.game.canvas)

        pointerDrag.onMove((delta) => {
          if (pointerLock.isLocked()) {
            this.moveTop = -delta.y
            this.moveRight = delta.x
          }
        })
      }
    })
  }
}
