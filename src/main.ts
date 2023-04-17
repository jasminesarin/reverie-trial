import Phaser from 'phaser'
import PreloaderScene from './scenes/PreloaderScene'
import MainScene from './scenes/MainScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    // mode: Phaser.Scale.FIT,
    width: 800,
    height: 600,
    // zoom: 2,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: true,
    },
  },
  scene: [PreloaderScene, MainScene],
}

const game = new Phaser.Game(config)

export default game
