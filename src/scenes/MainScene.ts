import { Scene3D } from '@enable3d/phaser-extension'

export default class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension()
  }

  preload() {}

  create() {
    // create a nice scene
    this.third.warpSpeed()

    // this.third.add.box({ x: 1, y: 2 })

    this.third.physics.add.box({ x: 0, y: 4, z: 6 })

    // this.third.haveSomeFun()
  }

  update() {}
}
