import { ExtendedObject3D, Scene3D,  } from '@enable3d/phaser-extension'
import * as THREE from 'three'

export default class MainScene extends Scene3D {
  cams: { ortho: THREE.OrthographicCamera; perspective: THREE.OrthographicCamera | THREE.PerspectiveCamera; active: string; inTransition: boolean; offset: null }
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension({ maxSubSteps: 10, fixedTimeStep: 1 / 120 })

    this.third.renderer.outputEncoding = THREE.LinearEncoding


  }

  preload() {}

  async create() {

        const { lights } = await this.third.warpSpeed(
          '-ground',
          '-orbitControls',
        )
        const { hemisphereLight, ambientLight, directionalLight } = lights
        const intensity = 0.01
        hemisphereLight.intensity = 0.01
        ambientLight.intensity = 0.01
        directionalLight.intensity = 0.01


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
    this.third.warpSpeed('-ground')

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
    this.third.warpSpeed('ground', '-orbitControls')

    this.third.load.gltf('/assets/glb/terrace2.glb').then((object) => {
      const scene = object.scenes[0]

      const terrace = new ExtendedObject3D()
      terrace.name = 'scene'
      terrace.add(scene)
      this.third.add.existing(terrace)
      // add animations
      object.animations.forEach((anim, i) => {
        terrace.mixer = this.third.animationMixers.create(terrace)
        // overwrite the action to be an array of actions
        terrace.action = []
        terrace.action[i] = terrace.mixer.clipAction(anim)
        terrace.action[i].play()
      })

      terrace.traverse((child: any) => {
        if (child.isMesh) {
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
        }
      })
    })
    //adding idle.glb file
    this.third.load.gltf('public/assets/glb/test.glb').then((object) => {
      const bea = object.scene.children[0]
      this.bea.name = 'bea'
      this.bea.rotateY(Math.PI + 0.1)
      this.bea.add(bea)
      this.bea.rotation.set(0, Math.PI * 1.5, 0)
      this.bea.position.set(-4.83, -0.18, 7)
      //add shadow
      this.bea.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = child.receiveShadow = true
          child.material.roughness = 1
          child.material.metalness = 0
        }
      })
      this.third.animationMixers.add(this.bea.animation.mixer)
      object.animations.forEach((animation) => {
        if (animation.name) {
          this.bea.animation.add(animation.name, animation)
        }
      })
      this.bea.animation.play('idle')

      /**
       * Add the player to the scene with a body
       */
      this.third.add.existing(this.bea)
      this.third.physics.add.existing(this.bea, {
        shape: 'sphere',
        radius: 0.25,
        width: 0.5,
        offset: { y: -0.25 },
      })
      this.bea.body.setFriction(0.8)
      this.bea.body.setAngularFactor(0, 0, 0)

      // https://docs.panda3d.org/1.10/python/programming/physics/bullet/ccd
      this.bea.body.setCcdMotionThreshold(1e-7)
      this.bea.body.setCcdSweptSphereRadius(0.25)

      this.controls = new ThirdPersonControls(this.third.camera, this.bea, {
        offset: new THREE.Vector3(0, 1, 0),
        targetRadius: 3,
      })
      // set initial view to 90 deg theta
      this.controls.theta = 90

      /**
       * Add Pointer Lock and Pointer Drag
       */
      if (!isTouchDevice) {
        let pl = new PointerLock(this.game.canvas)
        let pd = new PointerDrag(this.game.canvas)
        pd.onMove((delta) => {
          if (pl.isLocked()) {
            this.moveTop = -delta.y
            this.moveRight = delta.x
          }
        })
      }
    })
  }

  update() {}
}
