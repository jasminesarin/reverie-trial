import {
  ExtendedObject3D,
  JoyStick,
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
  canJump = true
  canMove = false
  moveTop = 0
  moveRight = 0
  keys!: {
    a: Phaser.Input.Keyboard.Key
    w: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
  }
  rotation: THREE.Vector3
  theta: number
  rotationPlayer: THREE.Vector3
  thetaPlayer: number
  speed = 4

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension({ maxSubSteps: 10, fixedTimeStep: 1 / 120 })

    this.third.renderer.outputEncoding = THREE.LinearEncoding
  }

  preload() {}

  async create() {
    this.createWorld()
    this.createCamera()
    this.createScene()
    this.createPlayer()
    this.addControls()
    //this.addCamera()
    // this.moveCamera()
  }

  private async createWorld() {
    // set up scene (light, ground, grid, sky, orbitControls)
    // this.third.warpSpeed()

    const { lights, ground } = await this.third.warpSpeed('-orbitControls')

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

      // TODO: add animations
      // object.animations.forEach((anim, i) => {
      //   this.terrace.mixer = this.third.animationMixers.create(this.terrace)
      //   // overwrite the action to be an array of actions
      //   this.terrace.action = []
      //   this.terrace.action[i] = this.terrace.mixer.clipAction(anim)
      //   this.terrace.action[i].play()
      // })

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

        child.castShadow = true
        child.receiveShadow = true
        // child.material.roughness = 1
        // child.material.metalness = 0
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
          this.player.position.setY(-delta.y)
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
          styles: { left: 35, bottom: 35, size: 100 },
        })

        axis.onMove((event) => {
          // Update Camera
          this.moveTop = event.x * 3
          this.moveRight = event.y * 3
        })

        const buttonA = joystick.add.button({
          letter: 'A',
          styles: { right: 35, bottom: 110, size: 80 },
        })

        buttonA.onClick(() => this.jump())

        const buttonB = joystick.add.button({
          letter: 'B',
          styles: { right: 110, bottom: 35, size: 80 },
        })

        buttonB.onClick(() => (this.canMove = true))
        buttonB.onRelease(() => (this.canMove = false))
      }
    }
  }

  jump() {
    if (!this.player || !this.canJump) {
      return
    }

    this.canJump = false
    this.player.anims.play('jump_running', 500, false)

    this.time.addEvent({
      delay: 650,
      callback: () => {
        this.canJump = true
        this.player.anims.play('idle')
      },
    })

    this.player.body.applyForceY(6)
  }

  update(time, delta) {
    if (this.player && this.player.body) {
      // Update Controls

      const deltaX = this.moveRight * 2
      const deltaY = -this.moveTop * 2

      // this.controls.update(deltaX, deltaY)

      if (!isTouchDevice) {
        this.moveRight = 0
        this.moveTop = 0
      }

      this.playerTurn()
      this.playerMove()
      this.playerJump()
    }
  }

  playerTurn() {
    /**
     * Player Turn
     */
    const v3 = new THREE.Vector3()

    this.rotation = this.third.camera.getWorldDirection(v3)
    this.theta = Math.atan2(this.rotation.x, this.rotation.z)
    this.rotationPlayer = this.player.getWorldDirection(v3)
    this.thetaPlayer = Math.atan2(this.rotationPlayer.x, this.rotationPlayer.z)
    this.player.body.setAngularVelocityY(0)

    const l = Math.abs(this.theta - this.thetaPlayer)
    let rotationSpeed = isTouchDevice ? 2 : 4
    let d = Math.PI / 24

    if (l > d) {
      if (l > Math.PI - d) {
        rotationSpeed *= -1
      }

      if (this.theta < this.thetaPlayer) {
        rotationSpeed *= -1
      }

      this.player.body.setAngularVelocityY(rotationSpeed)
    }
  }

  playerMove() {
    // if (this.canMove === false) {
    //   return
    // }

    /**
     * Player Move
     */
    if (this.keys.w.isDown) {
      this.playerMoveForward()
    } else {
      if (this.player.anims.current === 'run' && this.canJump) {
        this.player.anims.play('idle')
      }
    }
  }

  private playerMoveForward() {
    if (this.player.anims.current === 'idle' && this.canJump) {
      this.player.anims.play('run')
    }

    const x = Math.sin(this.theta) * this.speed
    const y = this.player.body.velocity.y
    const z = Math.cos(this.theta) * this.speed

    this.player.body.setVelocity(x, y, z)
  }

  playerJump() {
    /**
     * Player Jump
     */
    if (this.keys.space.isDown && this.canJump) {
      this.jump()
    }
  }
}
