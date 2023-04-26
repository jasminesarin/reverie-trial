import { ExtendedObject3D, Scene3D, } from '@enable3d/phaser-extension'
import * as THREE from 'three'

export default class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension()

    this.third.renderer.outputEncoding = THREE.LinearEncoding
  }

  preload() {}

  async create() {
    // set up scene (light, ground, grid, sky, orbitControls)
    this.third.warpSpeed('-ground')

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      2,
      5000,
    )
    camera.position.set(-10, 50, -50)
    camera.lookAt(-50, 50, -30)
    // now modify the features (if needed)
    // const camera= this.warpSpeed('camera')

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

      const { hemisphereLight, ambientLight, directionalLight } = this.lights
      hemisphereLight.intensity = 0.65
      ambientLight.intensity = 0.65
      directionalLight.intensity = 0.65

      scene3D.orbitControls.target.set(0, 5, 0)

      // this.third.add.box({ x: 1, y: 2 })
      //this.third.physics.add.box({ x: 0, y: 4, z: 6 })
      // this.third.haveSomeFun()
      //this.third.physics.add.box({ y: 10, x: 35 }, { lambert: { color: 'red' } })

      //lights
      // const { lights } = await this.warpSpeed(
      //   'lights',
      //   '-ground',
      //   '-orbitControls',
      // )

      // const { hemisphereLight, ambientLight, directionalLight } = this.lights
      // const intensity = 0.65
      // hemisphereLight.intensity = intensity
      // ambientLight.intensity = intensity
      // directionalLight.intensity = intensity

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
  }

  update() {}
}
