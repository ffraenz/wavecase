
import View from './View'
import Wavecase from './Wavecase'
import palliumSpec from './fonts/pallium'

export default class App extends View {
  constructor () {
    super()
    this._wavecase = null
    this._sizes = [300, 370, 230]
    this._text = ''
    this._assetCount = 0
    this._preloadedAssetCount = 0
  }

  render () {
    return document.querySelector('.app')
  }

  run () {
    // bind elements
    let $root = this.getElement()
    this._$fontSizeBtn = $root.querySelector('.app__btn-font-size')
    this._$replayBtn = $root.querySelector('.app__btn-replay')
    this._$clearBtn = $root.querySelector('.app__btn-clear')
    this._$content = $root.querySelector('.app__content')

    // read text
    let $wavecase = $root.querySelector('.app__wavecase')
    this._text = $wavecase !== null ? $wavecase.innerText : ''
    if ($wavecase !== null) {
      $wavecase.parentNode.removeChild($wavecase)
    }

    // start preloading assets
    this.preload()
  }

  preload () {
    // create progress bar
    this._$progress = document.createElement('div')
    this._$progress.classList.add('progress-bar__progress')
    this._$progress.innerText = `0%`

    let $progressBar = document.createElement('div')
    $progressBar.classList.add('progress-bar')
    $progressBar.appendChild(this._$progress)

    // create loading overlay
    this._$loading = document.createElement('div')
    this._$loading.classList.add('app__loading')
    this._$loading.appendChild($progressBar)
    this.getElement().appendChild(this._$loading)

    // collect image assets to preload
    let imageUrls = []
    palliumSpec.letters.forEach(letterSpec => {
      let url = letterSpec.spriteUrl
      if (url && imageUrls.indexOf(url) === -1) {
        imageUrls.push(url)
        this.preloadImage(palliumSpec.baseUrl + url)
      }
    })

    // collect audio assets to preload
    this.preloadAudio(palliumSpec.baseUrl + palliumSpec.audioUrl)
  }

  preloadImage (url) {
    this._assetCount++
    let image = new window.Image()
    image.onload = this.assetDidPreload.bind(this, url)
    image.src = url
  }

  preloadAudio (url) {
    this._assetCount++
    let audioPlayer = document.createElement('audio')
    audioPlayer.setAttribute('preload', 'preload')
    audioPlayer.oncanplaythrough = this.assetDidPreload.bind(this, url)
    audioPlayer.src = url
  }

  assetDidPreload (url) {
    this._preloadedAssetCount++

    let progress = this._preloadedAssetCount / this._assetCount
    this._$progress.style.width = `${progress * 100}%`
    this._$progress.innerText = `${progress}%`

    if (this._assetCount === this._preloadedAssetCount) {
      this.preloadDidComplete()
    }
  }

  preloadDidComplete () {
    // create wavecase instance and add it to dom
    this._wavecase = new Wavecase(palliumSpec)
    this._wavecase.setSize(this._sizes[0])
    let $wavecase = this._wavecase.getElement()
    $wavecase.classList.add('app__wavecase')
    this._$content.appendChild($wavecase)

    // set default text
    this._wavecase.setText(this._text)
    this._wavecase.replay()
    this._wavecase.pause()
    this._wavecase.focus()

    // bind events
    window.addEventListener('click', this.windowDidClick.bind(this))
    this._$fontSizeBtn.addEventListener('mousedown', this.fontSizeBtnDidClick.bind(this))
    this._$replayBtn.addEventListener('mousedown', this.replayBtnDidClick.bind(this))
    this._$clearBtn.addEventListener('mousedown', this.clearBtnDidClick.bind(this))

    let preventDefault = evt => evt.preventDefault()
    this._$fontSizeBtn.addEventListener('click', preventDefault)
    this._$replayBtn.addEventListener('click', preventDefault)
    this._$clearBtn.addEventListener('click', preventDefault)

    // remove loading overlay
    this.getElement().classList.remove('app--loading')

    setTimeout(() => {
      this._wavecase.play()
    }, 500)
  }

  windowDidClick (evt) {
    // forward focus to wavecase
    this._wavecase.focus()
  }

  replayBtnDidClick (evt) {
    this._wavecase.replay()
  }

  clearBtnDidClick (evt) {
    this._wavecase.setText('')
    this._wavecase.setMode('editing')
    this._wavecase.focus()
  }

  fontSizeBtnDidClick (evt) {
    let toggleIndex = this._sizes.indexOf(this._wavecase.getSize())
    toggleIndex = (toggleIndex + 1) % this._sizes.length
    this._wavecase.setSize(this._sizes[toggleIndex])
  }
}
