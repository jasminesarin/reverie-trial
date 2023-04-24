import { Scene3D, THREE } from '@enable3d/phaser-extension'

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
    // create a nice scene
    this.third.warpSpeed()

    // this.third.add.box({ x: 1, y: 2 })

    this.third.physics.add.box({ x: 0, y: 4, z: 6 })

    // this.third.haveSomeFun()

    //  this.third.warpSpeed('-ground', '-orbitControls')
    //         Phaser.GameObjects.LightsManager;

    //  const { hemisphereLight, ambientLight, directionalLight, } = this.third.lights(),
    //  const intensity = 0.65
    // hemisphereLight.intensity
    // ambientLight.intensity
    // directionalLight.intensity

    this.third.physics.add.box({ y: 10, x: 35 }, { lambert: { color: 'red' } })

    this.third.load.gltf('public/assets/glb/terrace.glb').then((object) => {
      const scene = object.scenes[0]

      const terrace = new ExtendedObject3D()
      terrace.name = 'scene'
      terrace.add(scene)
      this.third.add.existing(terrace)

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
