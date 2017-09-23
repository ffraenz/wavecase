
import 'babel-polyfill'
import browser from 'detect-browser/browser'
import App from './App'

if (browser) {
  // add browser class to html tag, makes browser sass mixin work
  const $html = document.querySelector('html')
  $html.classList.add(`browser--${browser.name}-${browser.version}`)
}

// create application instance
let app = new App()

// append to dom
let $body = document.querySelector('body')
$body.appendChild(app.getElement())

// run application
app.run()
