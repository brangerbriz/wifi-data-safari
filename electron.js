const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ fullscreen: true })

  // and load the index.html of the app.
  win.loadURL('http://localhost/habitat')
}
app.on('ready', createWindow)
