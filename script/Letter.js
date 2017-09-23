
import Animation from './Animation'

const letterHorizontalSprites = 10

export default class Letter extends Animation {
  constructor (spec) {
    super()
    this.setFrameCount(spec.frameCount)

    this._index = spec.index
    this._character = spec.character
    this._spriteUrl = spec.spriteUrl || null
    this._spacing = spec.spacing || 0.5

    // defaults
    this._size = 300
    this._x = 0
    this._y = 0
    this._ghostHidden = true

    // elements
    this._$face = null
    this._$ghost = null

    // apply spec
    spec.size && this.setSize(spec.size)
    spec.x && this.setX(spec.x)
    spec.y && this.sety(spec.y)
  }

  render () {
    this._$ghost = this.renderGhost()
    this._$face = this.renderFace()

    let $root = document.createElement('span')
    $root.classList.add('letter')
    this._$ghost && $root.appendChild(this._$ghost)
    $root.appendChild(this._$face)
    return $root
  }

  renderGhost () {
    if (this._spriteUrl === null) {
      // there is no ghost if there is no sprite
      return null
    }

    let $ghost = document.createElement('span')
    $ghost.classList.add('letter__ghost')
    $ghost.style.backgroundImage = `url(${this._spriteUrl})`

    // show last frame of spritesheet as ghost image
    $ghost.style.backgroundPosition =
      this.frameToBackgroundPosition(this.getFrameCount() - 1)
    return $ghost
  }

  renderFace () {
    let $face = document.createElement('span')
    $face.classList.add('letter__face')
    $face.innerText = this._character

    if (this._spriteUrl !== null) {
      // apply sprite, if any
      $face.style.backgroundImage = `url(${this._spriteUrl})`
    }

    return $face
  }

  frameToBackgroundPosition (frame) {
    let y = parseInt(frame / letterHorizontalSprites)
    let x = frame - (y * letterHorizontalSprites)
    return `-${x * 100}% -${y * 100}%`
  }

  renderFrame (frame) {
    // move background image to frame position
    this._$face.style.backgroundPosition =
      this.frameToBackgroundPosition(frame)

    // update ghost hidden
    if (this._$ghost && this._ghostHidden !== this.hasReachedLastFrame()) {
      this._ghostHidden = !this._ghostHidden
      this._$ghost.classList.toggle('letter__ghost--hidden', this._ghostHidden)
    }
  }

  getIndex () {
    return this._index
  }

  getCharacter () {
    return this._character
  }

  getSpacing () {
    return this._spacing
  }

  getSize () {
    return this._size
  }

  setSize (size) {
    if (this._size !== size) {
      this._size = size
      this.getElement().style.width = `${size}px`
      this.getElement().style.height = `${size}px`
    }
    return this
  }

  getX () {
    return this._x
  }

  setX (x) {
    if (this._x !== x) {
      this._x = x
      this.getElement().style.left = `${x}px`
    }
    return this
  }

  getY () {
    return this._y
  }

  setY (y) {
    if (this._y !== y) {
      this._y = y
      this.getElement().style.top = `${y}px`
    }
    return this
  }
}
