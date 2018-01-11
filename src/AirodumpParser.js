const fs = require('fs')
const EventEmitter = require('events')
const _ = require('underscore')
const macLookup = require('mac-lookup')

class AirodumpParser extends EventEmitter {

	constructor() {
		super()
		this.networks = {}
		this.stations = {}
	}

	parseCSV(airodumpCSV) {

		const networks = []
		const devices = []

		const split = airodumpCSV.indexOf('Station MAC, First time seen, Last time seen, Power, # packets, BSSID, Probed ESSIDs')
		if (split > -1) {

			// skip some empty chars and newlines
			const nets = airodumpCSV.substring(2, split - 3).split('\r\n')
			const stats = airodumpCSV.substring(split).split('\r\n')

			nets.forEach((line, i) => {
				// skip the header
				if (i != 0) {
					let vals = line.split(', ')
					if (vals.length == 14 || vals.length == 15) {

						// this is the most annoying thing in the whole world!
						// the airodump-ng csv IS NOT a csv... I've said it before
						// and it is going to be the death of me. Unnecessary white
						// space everywhere, ', ' dilimeters, and INCONSISTENT uses
						// of ',' as a delimiter in some occasions 
						// (the Cipher/Authentication seperator), but not always.
						// when this is the case, the number of values is 14
						// instead of 15, so we account for this by splitting on
						// the ',' character instead of the ', ' characters for
						// that particular column only! Fuck... That...
						if (vals.length == 14) {
							vals = [].concat(vals.slice(0, 6), vals[6].split(','), vals.slice(7))
						}

						networks.push({
							mac: vals[0],
							firstSeen: vals[1],
							lastSeen: vals[2],
							channel: parseInt(vals[3]),
							speed: parseInt(vals[4]),
							privacy: vals[5].trim(),
							cipher: vals[6].trim(),
							auth: vals[7].trim(),
							power: parseInt(vals[8]),
							beacons: parseInt(vals[9]),
							iv: parseInt(vals[10]),
							lanIP: vals[11].split('.').map(x => parseInt(x)).join('.'),
							ssid: vals[13].trim().replace('\r', '')
						})
					// don't worry about lines that are empty strings
					} else if (vals.length > 1) {
						console.error('[warning] network entry doesn\'t have 15 columns')
						console.log(vals)
					}
				}
			})

			stats.forEach((line, i) => {
				// skip the header
				if (i != 0) {
					
					// the networks csv ends the last column with ', '
					// if the value is none, but the stations csv does not (arg...)
					// so we ad one to the end for consistency and to make parsing
					// easier
					if (line[line.length - 1] == ',') line += ' '

					const vals = line.split(', ')
					if (vals.length == 7) {
						devices.push({
							mac: vals[0],
							firstSeen: vals[1],
							lastSeen: vals[2],
							power: parseInt(vals[3]),
							packets: parseInt(vals[4]),
							network: vals[5].trim() == '(not associated)' ? null : vals[5].trim(),
							probes: vals[6].trim().split(',').filter(x => x != '')
						})
					// don't worry about lines that are empty strings
					} else if (vals.length > 1) {
						console.error('[warning] device entry doesn\'t have 7 columns')
						console.log(vals)
					}
				}
			})
		}

		return { networks, devices }
	}

	loadCSV(filename) {

		fs.readFile(filename, 'utf8', (err, data) => {
			if (err) {
				console.log(`[error] error loading ${filename}. Exiting.`)
				process.exit(1)
			}

			data = data.toString()

			const { networks, devices } = this.parseCSV(data)

			this._addVendorInfo(networks, nets => this._updateNetworks(nets))
			this._addVendorInfo(devices, devs => this._updateStations(devs)) 
		})
	}

	_addVendorInfo(devices, callback) {
		callback = _.after(devices.length, callback)
		devices.forEach(dev => {
			if (dev.hasOwnProperty('vendor')) {
				callback(devices)
			} else {
				macLookup.lookup(dev.mac, (err, vendor) => {
					if (err) throw err
					else dev.vendor = vendor
					callback(devices)
				})
			}
		}) 
	}

	_updateNetworks(networks) {

		const nets = []
		networks.forEach((net) => {
			// if this network hasn't been seen before,
			// or its values have changed, overwrite it.
			if (!this.networks.hasOwnProperty(net.mac) ||
				!_.isEqual(net, this.networks[net.mac])) {
				this.networks[net.mac] = net
				nets.push(net)
			}
		})

		if (nets.length > 0) {
			console.log(`Emitting ${nets.length} networks`)
			this.emit('networks', nets)
		}
	}

	// same function as update networks, but with stations
	_updateStations(stations) {
		const stats = []
		stations.forEach((stat) => {
			if (!this.stations.hasOwnProperty(stat.mac) ||
				!_.isEqual(stat, this.stations[stat.mac])) {
				this.stations[stat.mac] = stat
				stats.push(stat)
			}
		})

		if (stats.length > 0) {
			console.log(`Emitting ${stats.length} stations`)
			this.emit('stations', stats)
		}
	}
}

module.exports = {
	AirodumpParser
}
