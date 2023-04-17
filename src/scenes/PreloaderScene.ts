export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloaderScene' })
  }

  preload() {}

  create() {
    this.scene.start('MainScene')
  }

  update() {}
}
