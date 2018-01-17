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
let airodumpCSVfile

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
			console.error(`[error] a wireless interace must be provided with --iface argument. Your network interaces are: ${getNetInterfaces().join(', ')}`)
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

		spawnSync('airmon-ng', ['start', args.iface])
		// lets get our listen on!
		iface = getNetInterfaces().find(x => x.indexOf('mon') >= 0)
		if (iface) {
			spawnAirodump(iface)
		} else {
			console.error(`[error] could not create a monitor mode device from ${iface}, exiting.`)
			process.exit(1)
		}

	} else {
		iface = args.iface
		// lets get our listen on!
		spawnAirodump(iface)
	}

	app.use(express.static('www'))

		// wigle data loaded from json files
	let wigle = {
		cached:{}, // any mac map-client asked for once before
		data:[], // all the json wigle data
		ranks:{} // SSIDs && how often they show up in data
	}

	// if the user has wigle_data, load and serve it to the admin map
	// using websockets
	if (fs.existsSync('data/wigle_data')) {
		// load wigle data
		fs.readdirSync('data/wigle_data').forEach((file,i)=>{
			fs.readFile(`data/wigle_data/${file}`,(err,data)=>{
				if(err) throw err;
				JSON.parse(data).forEach((obj)=>{
					// update wigle data
					wigle.data.push({
						ssid:obj.ssid,
						lat:obj.trilat,
						lon:obj.trilong,
						date:obj.lastupdt
					})
					// update ssid ranking
					if( wigle.ranks.hasOwnProperty(obj.ssid) )
						wigle.ranks[obj.ssid]++
					else wigle.ranks[obj.ssid] = 1
				})
			})
		})
	}

	io.on('connection', function (socket) {
		console.log('[verbose] new client socket connection')

		socket.on('get-ipinfo',()=>{
			socket.emit('ipinfo', `${spawnSync('curl',['ipinfo.io']).stdout}`)
		})

		socket.on('get-wigle-data',(dev)=>{
			if( !wigle.cached.hasOwnProperty(dev.mac) ||
				wigle.cached[dev.mac].length!==dev.probes.length //needs update
			){
				wigle.cached[dev.mac] = []
				wigle.data.forEach((d)=>{
					if( dev.probes.indexOf(d.ssid)>=0 ){
						let o = Object.assign({},d)
						o.rank = wigle.ranks[d.ssid]
						wigle.cached[dev.mac].push(o)
					}
				})
			}
			socket.emit('wigle-data',wigle.cached[dev.mac])
		})

		socket.on('get-init-data',()=>{
			fs.readFile(airodumpCSVfile, 'utf8', (err, data) => {
				if (err) throw error
				data = data.toString()
				socket.emit('init-data',airodumpParser.parseCSV(data).devices)
			})
		})

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
			files = files.filter(file => file.match(/\d+/))
			files.sort((a, b) => {
				return parseInt(b.match(/\d+/)[0]) - parseInt(a.match(/\d+/)[0])
			})

			airodumpCSVfile = 'data/' + files[0]
			console.log(`[verbose] poling ${airodumpCSVfile} every 1000 ms`)
			setInterval(() => airodumpParser.loadCSV(airodumpCSVfile), 1000)
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
