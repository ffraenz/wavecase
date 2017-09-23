
import Animation from './Animation'
import Letter from './Letter'

// reset after 5 min inactivity
const resetCooldown = 5 * 60 * 1000

export default class Wavecase extends Animation {
  constructor (spec) {
    super()
    this.setFPS(spec.fps)
    this.setFrameSkips(spec.frameSkips)

    // meta data
    this._name = spec.name
    this._baseUrl = spec.baseUrl
    this._audioUrl = spec.audioUrl

    // frame config
    this._letterFrameCount = spec.letterFrameCount
    this._letterAudioDuration = spec.letterAudioDuration
    this._frameOffsetStart = spec.frameOffsetStart
    this._frameOffsetEnd = spec.frameOffsetEnd

    // layout config
    this._size = spec.size || 300
    this._leading = spec.leading
    this._tracking = spec.tracking

    // storage
    this._mode = 'editing'
    this._cooldownTimer = null
    this._letters = []
    this._letterStartFrame = []

    // dom elements
    this._$cursor = null
    this._$textarea = null

    // create letter spec map
    this._letterSpec = {}
    spec.letters.forEach(letterSpec => {
      this._letterSpec[letterSpec.character] = letterSpec
    })

    // configure audio players
    // character animations overlap, multiple audio players are necessary
    this._audioPlayers = new Array(3).fill().map(() => {
      let audioPlayer = document.createElement('audio')
      audioPlayer.setAttribute('preload', 'preload')
      audioPlayer.src = this._baseUrl + this._audioUrl
      return audioPlayer
    })

    // bind events
    window.addEventListener('resize', this.layout.bind(this))
  }

  render () {
    // render cursor
    this._$cursor = this.renderCursor()

    // render textarea
    this._$textarea = this.renderTextarea()

    // render wavecase element
    let $root = document.createElement('div')
    $root.classList.add('wavecase')
    $root.addEventListener('click', this.wavecaseDidClick.bind(this))
    $root.appendChild(this._$cursor)
    $root.appendChild(this._$textarea)
    return $root
  }

  renderCursor () {
    let $cursor = document.createElement('div')
    $cursor.classList.add('wavecase__cursor')
    $cursor.style.height = `${this._size * 0.7}px`
    return $cursor
  }

  renderTextarea () {
    let $textarea = document.createElement('textarea')
    $textarea.classList.add('wavecase__textarea')
    $textarea.addEventListener('focus', this.textareaDidFocus.bind(this))
    $textarea.addEventListener('blur', this.textareaDidBlur.bind(this))
    $textarea.addEventListener('keydown', this.textareaDidKeyPress.bind(this, 'keydown'))
    $textarea.addEventListener('keyup', this.textareaDidKeyPress.bind(this, 'keyup'))
    return $textarea
  }

  viewDidRender () {
    // initial layout
    this.layout()
  }

  addLetter (character) {
    let spec = this._letterSpec[character]
    if (spec === undefined) {
      // letter is not defined in alphabet
      return false
    }

    // create letter instance
    let letter = new Letter({
      index: spec.index,
      character,
      spacing: spec.spacing,
      frameCount: this._letterFrameCount,
      spriteUrl: spec.spriteUrl ? this._baseUrl + spec.spriteUrl : null,
      size: this._size
    })

    let reachedLastFrame = this.hasReachedLastFrame()

    // append letter instance
    let index = this._letters.length
    this._letters.push(letter)

    // append letter to dom
    this.getElement().appendChild(letter.getElement())

    // layout letter frames and layout letters on canvas
    this.layoutFrameTimeline()
    this.layout()

    if (reachedLastFrame) {
      // jump back to the start frame to show whole letter animation
      this.setFrame(this._letterStartFrame[index])
    }

    // render letter frame
    this.renderLetterFrame(letter, index)

    this.play()
  }

  removeLetter () {
    let removedLetters = this._letters.splice(-1)
    if (removedLetters.length > 0) {
      // remove letter from dom
      this.getElement().removeChild(removedLetters[0].getElement())

      this.layoutFrameTimeline()
      this.layout()
    }
    return this
  }

  getText () {
    return this._letters.map(letter => letter.getCharacter()).join('')
  }

  setText (text) {
    // remove each letter from dom
    this._letters.forEach(letter => {
      this.getElement().removeChild(letter.getElement())
    })

    // clear letters
    this._letters = []

    if (text.length > 0) {
      // append each letter
      text.split('').filter(character => this.addLetter(character))
    } else {
      // only layout
      this.layoutFrameTimeline()
      this.layout()
    }

    return this
  }

  getSize () {
    return this._size
  }

  setSize (size) {
    if (this._size !== size) {
      this._size = size

      // set size of each letter
      this._letters.forEach(letter => letter.setSize(size))

      // set cursor size
      this._$cursor.style.height = `${this._size * 0.7}px`

      // layout
      this.layout()
    }
    return this
  }

  getMode () {
    return this._mode
  }

  setMode (mode) {
    if (this._mode !== mode) {
      this._mode = mode
      this.getElement().classList
        .toggle('wavecase--editing', mode === 'editing')
      this.getElement().classList
        .toggle('wavecase--playing', mode === 'playing')
    }
    return this
  }

  layout () {
    let letters = this._letters
    let letterTrackingSpace = this._size * this._tracking
    let lineHeight = this._size * this._leading
    let wavecaseWidth = this.getElement().offsetWidth

    // compose lines of letters
    let linesWidth = []
    let linesLetters = []
    let linesPositions = []

    // current line
    let lineWidth = 0
    let lineLetters = []
    let linePositions = []

    let letter, letterWidth, letterOffset, letterLeft, letterRight

    // track line break character
    let breakIndex = null
    let breakLineWidth = null

    // go through each letter
    let index = 0
    while (index < letters.length) {
      letter = letters[index]
      letterWidth = this._size * letter.getSpacing()
      letterOffset = this._size * (1 - letter.getSpacing()) * 0.5
      letterLeft = lineWidth + letterTrackingSpace - letterOffset
      letterRight = letterLeft + letterWidth + letterOffset

      if (letter.getCharacter() === ' ') {
        // track last occurred break character
        breakIndex = index
        breakLineWidth = lineWidth
      }

      // check if end of line has been reached
      if (letterRight > wavecaseWidth) {
        // check if there is a space character to break after
        if (breakIndex !== null) {
          // move cursor back after last break character
          let removeCount = index - breakIndex
          lineLetters.splice(-removeCount)
          linePositions.splice(-removeCount)
          index -= removeCount - 1
          lineWidth = breakLineWidth
        }

        // add current line to lines
        linesWidth.push(lineWidth)
        linesLetters.push(lineLetters)
        linesPositions.push(linePositions)

        // reset line
        lineWidth = 0
        lineLetters = []
        linePositions = []

        // reset break character
        breakIndex = null
        breakLineWidth = null
      } else {
        // add letter to line and track line width
        lineLetters.push(letter)
        linePositions.push(letterLeft)
        lineWidth = letterRight
        index++
      }
    }

    // add last line to lines
    linesWidth.push(lineWidth)
    linesLetters.push(lineLetters)
    linesPositions.push(linePositions)

    // calculate and apply height
    let wavecaseHeight = linesWidth.length * lineHeight
    this.getElement().style.height = `${wavecaseHeight}px`

    // position lines and characters
    for (let line = 0; line < linesWidth.length; line++) {
      lineWidth = linesWidth[line]
      lineLetters = linesLetters[line]
      linePositions = linesPositions[line]

      let lineX = (wavecaseWidth - lineWidth) * 0.5
      let lineY = line * this._size * this._leading

      for (let i = 0; i < lineLetters.length; i++) {
        letter = lineLetters[i]
        letter.setX(lineX + linePositions[i])
        letter.setY(lineY)
      }

      if (line === linesWidth.length - 1) {
        // position cursor
        this._$cursor.style.top = `${lineY + this._size * 0.5}px`
        this._$cursor.style.left = `${wavecaseWidth - lineX}px`
      }
    }
  }

  layoutFrameTimeline () {
    if (this._letters.length === 0) {
      this._letterStartFrame = []
      this.setFrameCount(0)
      return
    }

    // layout frame of each letter in timeline
    let frame = 0
    this._letterStartFrame = this._letters.map(letter => {
      let letterStartFrame = frame
      frame +=
        this._frameOffsetStart +
        letter.getFrameCount() +
        this._frameOffsetEnd
      return letterStartFrame
    })

    // set number of total frames
    this.setFrameCount(frame - this._frameOffsetEnd)
  }

  renderFrame (frame) {
    this._letters.forEach(this.renderLetterFrame.bind(this))
  }

  renderLetterFrame (letter, index = this._letters.indexOf(letter)) {
    let frameBefore = letter.getFrame()
    let reachedLastFrameBefore = letter.hasReachedLastFrame()
    let frame = this.getFrame() - this._letterStartFrame[index]

    // only animate forward
    // allows jumping back frames to animate whole new letter while typing
    letter.setFrame(Math.max(frame, frameBefore))

    // choose audio player for this letter
    let audioPlayer = this.audioPlayerForLetter(letter)

    // check if letter is animating and if audio needs to be triggered
    if (frame >= 0 && !letter.hasReachedLastFrame() && audioPlayer.paused) {
      // determine where the letter is located in the audio sprite
      let audioTime = (letter.getIndex() - 1) * this._letterAudioDuration

      // add the animation time that already passed for this letter
      audioTime += letter.getTime()

      // spaces are weird, they need some extra time and love
      if (letter.getCharacter() === ' ') {
        audioTime += -420
      }

      // seek to the time and hit play
      audioPlayer.currentTime = audioTime / 1000
      audioPlayer.play()
    } else if (!reachedLastFrameBefore && letter.hasReachedLastFrame()) {
      // this letter has just reached its last frame, pause audio
      audioPlayer.pause()
    }
  }

  audioPlayerForLetter (letter) {
    let index = this._letters.indexOf(letter)
    return this._audioPlayers[index % this._audioPlayers.length]
  }

  play () {
    super.play()
    this.stopCooldownTimer()
  }

  pause () {
    super.pause()
    this.startCooldownTimer()

    // pause all audio players, too
    this._audioPlayers.forEach(audioPlayer => audioPlayer.pause())
  }

  replay () {
    this.stop()
    this.setMode('playing')
    this.play()
    return this
  }

  reset () {
    super.reset()
    this._letters.forEach(letter => letter.setFrame(0))
    this._audioPlayers.forEach(audioPlayer => audioPlayer.pause())
  }

  animationDidFinish () {
    this.setMode('editing')
    this.startCooldownTimer()
  }

  startCooldownTimer () {
    this.stopCooldownTimer()
    this._cooldownTimer = setTimeout(
      this.cooldownTimerDidTrigger.bind(this),
      resetCooldown)
  }

  stopCooldownTimer () {
    if (this._cooldownTimer !== null) {
      clearTimeout(this._cooldownTimer)
      this._cooldownTimer = null
    }
  }

  cooldownTimerDidTrigger () {
    this.stopCooldownTimer()
    this.setText('')
  }

  focus () {
    this._$textarea.focus()
    return this
  }

  wavecaseDidClick (evt) {
    evt.preventDefault()
    this.setMode('editing')
    this.focus()
    return false
  }

  textareaDidFocus (evt) {
    this._$root.classList.add('wavecase--focus')

    if (!this.hasReachedLastFrame()) {
      this.play()
    }
  }

  textareaDidKeyPress (type, evt) {
    let keyCode = evt.which || evt.keyCode

    if (type === 'keydown') {
      // control keys
      switch (keyCode) {
        case 8:
          // backspace
          this.removeLetter()
          return
        case 39:
          // right arrow
          this.skipToEnd()
          return
      }
    }

    // append each letter typed into the textarea
    this._$textarea.value
      .split('')
      .forEach(this.addLetter.bind(this))

    // reset textarea
    this._$textarea.value = ''

    // switch mode to editing
    this.setMode('editing')
  }

  textareaDidBlur (evt) {
    this._$root.classList.remove('wavecase--focus')

    // skip animation
    this.pause()
  }
}
