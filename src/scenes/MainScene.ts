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
  controls!: ThirdPersonControls

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension({ maxSubSteps: 10, fixedTimeStep: 1 / 120 })

    this.third.renderer.outputEncoding = THREE.LinearEncoding
              this.canJump = true
              this.move = false

              this.moveTop = 0
              this.moveRight = 0
  }

  preload() {}

  async create() {
    // this.third.haveSomeFun()

    // const renderer = new THREE.WebGLRenderer()
    // renderer.setSize(window.innerWidth, window.innerHeight)
    // document.body.appendChild(renderer.domElement)
    // additionally warpSpeed() returns the camera, ground, lights, orbitControls.
    // const { camera, lights, orbitControls } = await this.warpSpeed()

    //loading glb file
    // removing ground and orbital controls from the glb file
    // this.third.warpSpeed('ground', '-orbitControls')

    this.createWorld()
    this.createCamera()
    this.createScene()
    this.createPlayer()
    this.addControls()
    // this.addCamera()
    // this.moveCamera()
  }

  update() {}

  private async createWorld() {
    // set up scene (light, ground, grid, sky, orbitControls)
    this.third.warpSpeed()

    const { lights } = await this.third.warpSpeed('-ground', '-orbitControls')

    if (lights === undefined) {
      throw new Error('Lights not loaded')
    }

    // TODO: Fix this
    const { ambientLight, directionalLight, hemisphereLight } = lights
    hemisphereLight.intensity = 0.3
    ambientLight.intensity = 0.3
    directionalLight.intensity = 0.3
  }

  private createCamera() {
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
  }

  private createScene() {
    this.third.load.gltf('/assets/glb/terrace.glb').then((object) => {
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

  private createPlayer() {
    this.third.load.gltf('public/assets/glb/idle.glb').then((object) => {
      const scene = object.scenes[0]

      this.player = new ExtendedObject3D()
      this.player.name = 'scene'
      this.player.add(scene)
      this.third.add.existing(this.player)

      // Rotate the player
      this.player.rotateY(Math.PI + 0.1)
      // this.player.rotation.set(0, Math.PI * 1.5, 0)
      this.player.position.set(0, 0, 0)

      //set scale
      this.player.scale.set(2, 2, 2)

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

      //Add the player to the scene with a body
      this.third.add.existing(this.player)
      this.third.physics.add.existing(this.player, {
        shape: 'box',
        height: 1,
        width: 0.5,
        depth: 0.4,
        offset: { y: -1, z: 1.5 },
      })
      //this.player.body.setFriction(0.8)
      //this.player.body.setAngularFactor(-10, -10, 0)

      // https://docs.panda3d.org/1.10/python/programming/physics/bullet/ccd
      this.player.body.setCcdMotionThreshold(1e-7)
      this.player.body.setCcdSweptSphereRadius(0.25)
    })
  }

  private addControls() {
    this.controls = new ThirdPersonControls(this.third.camera, this.player, {
      offset: new THREE.Vector3(0, 1, 0),
      targetRadius: 3,
    })

    // set initial view to 90 deg theta
    this.controls.theta = 90

    // Add Pointer Lock and Pointer Drag
    if (!isTouchDevice) {
      let pointerLock = new PointerLock(this.game.canvas)
      let pointerDrag = new PointerDrag(this.game.canvas)

      pointerDrag.onMove((delta) => {
        if (pointerLock.isLocked()) {
          // FIX?
          // this.player.position.setY(-delta.y)
          this.moveTop = -delta.y
          this.moveRight = delta.x
        }
      })

      // Add Keys

      this.keys = {
        a: this.input.keyboard.addKey('a'),
        w: this.input.keyboard.addKey('w'),
        d: this.input.keyboard.addKey('d'),
        s: this.input.keyboard.addKey('s'),
        space: this.input.keyboard.addKey(32),
      }
      //Adding joystick
      if (isTouchDevice) {
            const joystick = new JoyStick()
            const axis = joystick.add.axis({
              styles: { left: 35, bottom: 35, size: 100 }
            })
            axis.onMove(event => {
              /**
               * Update Camera
               */
              const { top, right } = event
              this.moveTop = top * 3
              this.moveRight = right * 3
            })
            const buttonA = joystick.add.button({
              letter: 'A',
              styles: { right: 35, bottom: 110, size: 80 }
            })
            buttonA.onClick(() => this.jump())
            const buttonB = joystick.add.button({
              letter: 'B',
              styles: { right: 110, bottom: 35, size: 80 }
            })
            buttonB.onClick(() => (this.move = true))
            buttonB.onRelease(() => (this.move = false))
          }

    }
  }
}
