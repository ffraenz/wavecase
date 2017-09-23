
export default class View {
  constructor () {
    this._$root = null
  }

  getElement () {
    // lazily return element
    if (this._$root === null) {
      this._$root = this.render()
      this.viewDidRender()
    }
    return this._$root
  }

  render () {
    let $root = document.createElement('div')
    return $root
  }

  viewDidRender () {
    // override
  }
}
