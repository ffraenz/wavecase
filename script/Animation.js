
import View from './View'

export default class Animation extends View {
  constructor (spec) {
    super()

    // animation
    this._frameCount = 0

    // playback
    this._fps = 24
    this._frameSkips = 0

    // state
    this._frame = 0
    this._playing = false
    this._animationStartFrame = null
    this._animationStartTime = null
  }

  /**
   * Returns frames per second.
   * @return {number}
   */
  getFPS () {
    return this._FPS
  }

  setFPS (fps) {
    this._fps = fps
    return this
  }

  setFrameSkips (frameSkips) {
    this._frameSkips = frameSkips
    return this
  }

  framesToDuration (frames) {
    return (frames / (this._frameSkips + 1)) / this._fps * 1000
  }

  durationToFrames (duration) {
    return (duration / 1000 * this._fps) * (this._frameSkips + 1)
  }

  /**
   * Returns total number of frames.
   * @return {number}
   */
  getFrameCount () {
    return this._frameCount
  }

  setFrameCount (frameCount) {
    if (this._frameCount !== frameCount) {
      this._frameCount = frameCount
      this._frame = Math.min(this._frame, frameCount)
    }
    return this
  }

  /**
   * Returns current frame index.
   * @return {number}
   */
  getFrame () {
    return this._frame
  }

  setFrame (frame) {
    // keep frame index inside bounds
    frame = Math.max(Math.min(frame, this._frameCount - 1), 0)
    if (this._frame !== frame) {
      this._frame = frame
      this.renderFrame(frame)
    }
    return this
  }

  hasReachedLastFrame () {
    return this._frameCount === 0 || this._frame === this._frameCount - 1
  }

  getTime () {
    return this.framesToDuration(this.getFrame())
  }

  setTime (time) {
    return this.setFrame(this.durationToFrames(time))
  }

  /**
   * Renders frame index.
   * @override
   * @param {number} frame
   */
  renderFrame (frame) {
    // override
  }

  play () {
    if (this._playing === false) {
      // track begin
      this._playing = true
      this._animationStartFrame = this._frame
      this._animationStartTime = new Date().getTime()

      // first tick
      this.tick()
    }
    return this
  }

  pause () {
    if (this._playing === true) {
      this._playing = false
      this._animationStartFrame = null
      this._animationStartTime = null
    }
    return this
  }

  stop () {
    this.pause()
    this.reset()
    return this
  }

  reset () {
    this.setFrame(0)
    return this
  }

  skipToEnd () {
    this.setFrame(this._frameCount - 1)
    this.pause()
    return this
  }

  tick () {
    if (!this._playing) {
      // do nothing
      return
    }

    // calculate current time in animation
    let duration = new Date().getTime() - this._animationStartTime

    // calculate current frame
    let frame = parseInt(this._animationStartFrame +
      this.durationToFrames(duration))

    // move to frame
    this.setFrame(frame)

    if (!this.hasReachedLastFrame()) {
      // request next tick
      window.requestAnimationFrame(this.tick.bind(this))
    } else {
      // pause animation at last frame
      this.animationDidFinish()
      this.pause()
    }
  }

  animationDidFinish () {
    // override
  }
}
