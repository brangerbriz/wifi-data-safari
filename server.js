const { spawn, spawnSync } = require('child_process')
const { ArgumentParser } = require('argparse')
const fs = require('fs')
const isRoot = require('is-root')
const { AirodumpParser } = require('./src/AirodumpParser')
const { updateVendorMacs, getNetInterfaces } = require('./src/utils')
const express = require('express')
var commandExistsSync = require('command-exists').sync

const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const airodumpParser = new AirodumpParser()
let airodumpProc = null
let iface = null

main()

function main() {

	// validate that aircrack-ng tools are installed
	if (!commandExistsSync('airmon-ng')){
		console.error('[error] airmon-ng is not installed. Please install the Aircrack-ng suite.')
		process.exit(1)
	}

	if (!commandExistsSync('airodump-ng')) {
		console.error('[error] airmodump-ng is not installed. Please install the Aircrack-ng suite.')
		process.exit(1)
	}

	// must be run as root for airmon-ng and airodump-ng
	if (!isRoot()) {
		console.error('[error] server.js must be run as root. Exiting.')
		process.exit(1)
	}

	const args = parseArguments()
	if (args['update_vendor_macs']) updateVendorMacs() 
	else {
		if (!args.iface) {
			console.error('[error] a wireless interace must be provided with --iface argument.')
			process.exit(1)
		}
		launch(args)
	}

	process.on('uncaughtException', function (err) {
		cleanup(args)
		throw err
	})

	process.on('SIGINT', function() {
	    cleanup(args)
	    process.exit(0)
	})
}

function launch(args) {
	// if a monX interface wasn't specified, create one with airmon-ng
	if (args.iface.indexOf('mon') != 0) {
		console.log('[verbose] a monitor mode device wasn\'t provided, creating one with airmon-ng')
		const airmonProc = spawn('airmon-ng', ['start', args.iface])
		airmonProc.on('close', (code) => {
			// could have better error handling here, but w/e...
			// also should probably not assume that just because a user supplies
			// an interface that the monX device airmon-ng created is mon0...
			
			// lets get our listen on!
			iface = getNetInterfaces().find(x => x.indexOf('mon') >= 0)

			if (iface) {
				spawnAirodump(iface)
			} else {
				console.error(`[error] could create a monitor mode device from ${iface}, exiting.`)
				process.exit(1)
			}
		})
	} else {
		iface = args.iface
		// lets get our listen on!
		spawnAirodump(iface)
	}

	app.use(express.static('www'))

	io.on('connection', function (socket) {
		console.log('[verbose] new client socket connection')
		airodumpParser.on('networks', (networks) => {
			socket.emit('networks', networks)
		})

		airodumpParser.on('stations', (stations) => {
			socket.emit('stations', stations)
		})
	})

	console.log(`[info] HTTP server started on port ${args.port}`)
	server.listen(args.port)
}

function cleanup(args) {
	// kill airodump-ng
	// stop mon0

	if (airodumpProc) {
		airodumpProc.kill()
		console.log('[info] airodump-ng process exited')
	}

	// if the interface was create with airmon-ng
	// remove it
	if (iface && args.iface.indexOf('mon') < 0) {
		console.log(`[info] stopping ${iface} interface with airmon-ng`)
		spawnSync('airmon-ng', ['stop', iface])
	}
}

function spawnAirodump(iface) {
	
	console.log(`[verbose] spawinging airodump-ng with ${iface}`)
	// sudo airodump-ng mon0 --output-format csv -w output
	airodumpProc = spawn('airodump-ng', ['--output-format', 'csv', '--write', 'data/airodump', iface])
	
	airodumpProc.stderr.on('data', data => {
		// no-op. airodump-ng won't write to csv unless its stderr is read from!
	})

	airodumpProc.on('close', code => {
		console.log(`[warning] airodump-ng child process exited with exit code ${code}`)
	})

	// this is a h4ck. We need to wait and make sure that airodump-ng has created
	// a data/airodump-XX.csv file before we can read from it.
	setTimeout(() => {
		// get the name of the file (most recent data/airodump-XX.csv)
		// NOTE: this should run after the airodump process was created
		fs.readdir('data', (err, files) => {
			
			files = files.filter(file => file.indexOf('airodump-') == 0)
			files.sort((a, b) => {
				return parseInt(b.substring(9, 11)) - parseInt(a.substring(9, 11))
			})

			const filename = 'data/' + files[0]
			console.log(`[verbose] poling ${filename} every 1000 ms`)
			setInterval(() => airodumpParser.loadCSV(filename), 1000)
		})
	}, 1000)
}

function parseArguments() {
	const parser = new ArgumentParser({
  		version: '1.0.0',
  		addHelp: true,
  		description: 'Wireless data safari workshop server'
	})

	parser.addArgument(['-i', '--iface'], { 
		help: 'The wireless interface to use for airodump-ng. If a non monX interface is specified, airmon-ng will use it to create one.',
	})

	parser.addArgument(['-p', '--port'], { 
		help: 'The HTTP port to serve the browser interface on (default: 1337)',
		defaultValue: 1337,
		type: 'int'
	})

	parser.addArgument(['-u', '--update-vendor-macs'], {
		help: 'Update the vendor MAC address database. Must have an internet connection.',
		nargs: 0
	})

	return parser.parseArgs()
}
