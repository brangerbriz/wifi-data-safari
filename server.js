const { spawn } = require('child_process')
const { ArgumentParser } = require('argparse')
const fs = require('fs')
const isRoot = require('is-root')
const { AirodumpParser } = require('./src/AirodumpParser')
const express = require('express')
var commandExistsSync = require('command-exists').sync

const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const airodumpParser = new AirodumpParser()

main()

function main() {

	if (!commandExistsSync('airmon-ng')){
		console.error('[error] airmon-ng is not installed. Please install the Aircrack-ng suite.')
		process.exit(1)
	}

	if (!commandExistsSync('airodump-ng')) {
		console.error('[error] airmodump-ng is not installed. Please install the Aircrack-ng suite.')
		process.exit(1)
	}

	if (!isRoot()) {
		console.error('[error] server.js must be run as root. Exiting.')
		process.exit(1)
	}

	const args = parseArguments()

	// if a monX interface wasn't specified, create one with airmon-ng
	if (args.iface.indexOf('mon') != 0) {
		const airmonProc = spawn('airmon-ng', ['start', args.iface])
		airmonProc.on('close', (code) => {
			// could have better error handling here, but w/e...
			// also should probably not assume that just because a user supplies
			// an interface that the monX device airmon-ng created is mon0...
			spawnAirodump('mon0')
		})
	} else {
		spawnAirodump(args.iface)
	}

	app.use(express.static('www'))

	io.on('connection', function (socket) {
		
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

function spawnAirodump(iface) {
	
	console.log(`[verbose] spawinging airodump-ng with ${iface}`)
	// sudo airodump-ng mon0 --output-format csv -w output
	const airodumpProc = spawn('airodump-ng', ['--output-format', 'csv', '--write', 'data/airodump', iface])
	
	airodumpProc.stderr.on('data', data => {
		// no-op. airodump-ng won't write to csv unless its stderr is read from
	})

	airodumpProc.on('close', code => {
		console.log(`[info] airodump-ng child process exited with exit code ${code}`)
	})

	setTimeout(() => {
		// get the name of the file (most recent data/airodump-XX.csv)
		// NOTE: this should run after the airodump process was created
		fs.readdir('data', (err, files) => {
			
			files = files.filter(file => file.indexOf('airodump-') == 0)
			files.sort((a, b) => {
				return parseInt(b.substring(9, 11)) - parseInt(a.substring(9, 11))
			})

			const filename = 'data/' + files[0]
			console.log(`[info] poling ${filename} every 1000 ms`)
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
		required: true
	})

	parser.addArgument(['-p', '--port'], { 
		help: 'The HTTP port to serve the browser interface on (default: 1337)',
		defaultValue: 1337,
		type: 'int'
	})

	return parser.parseArgs()
}
