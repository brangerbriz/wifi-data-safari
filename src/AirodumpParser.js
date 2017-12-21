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

	parseCSV() {
		const networks = []
		const devices = []

		const split = data.indexOf('Station MAC, First time seen, Last time seen, Power, # packets, BSSID, Probed ESSIDs')
		if (split > -1) {

			// skip some empty chars and newlines
			const nets = data.substring(2, split - 3)
			const stats = data.substring(split)

			nets.forEach((line, i) => {
				if (i != 0) {
					const vals = line.split(', ')
					if (vals.length == 15) {
						networks.push({

						})
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

			data = data.toString().replace(/,\s/g, '`')
			const split = data.indexOf('Station MAC`First time seen`Last time seen`Power`# packets`BSSID`Probed ESSIDs')
			if (split > -1) {

				// skip some empty chars and newlines
				const networks = data.substring(2, split - 3)
				const stations = data.substring(split)

				// catch all error to mitigate the sudo node logout error I'm
				// experiencing on Ubuntu
				try {
					csvParse(networks, {columns: true, delimiter: '`', relax_column_count: true}, (err, output) => {
						if (err) throw err
						const devices = this._cleanNetworksCSVOutput(output)
						this._addVendorInfo(devices, (devs) => {
							this._updateNetworks(devs)
						})
					})

					csvParse(stations, {columns: true, delimiter: '`', relax_column_count: true}, (err, output) => {
						if (err) throw err
						const devices = this._cleanStationsCSVOutput(output)
						console.log(devices)

						this._addVendorInfo(devices, (devs) => {
							this._updateStations(devs)
						})
					})
				} catch (err) {
					console.error('[error] Error in loadCSV(...):')
					console.error(err)
				}
			}
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

	_cleanNetworksCSVOutput(networks) {
		// if (!networks) return []
		return networks.map((n) => {
			return {
				mac: n.BSSID,
				firstSeen: n['First time seen'].trim(),
				lastSeen: n['Last time seen'].trim(),
				channel: parseInt(n['channel']),
				speed: parseInt(n['Speed']),
				privacy: n['Privacy'].trim(),
				cipher: n['Cipher'].trim(),
				auth: n['Authentication'].trim(),
				power: parseInt(n['Power'].trim()),
				beacons: parseInt(n['# beacons']),
				iv: parseInt(n['# IV']),
				lanIP: n['LAN IP'].split('.').map(x => parseInt(x)).join('.'),
				ssid: n['ESSID'].trim().replace('\r', ''),
			}
		})
	}

	_cleanStationsCSVOutput(stations) {
		// if (!stations) return []
		// come back and see why filter bombs sometimes
		return stations
			.map((s) => {
					return {
						mac: s['Station MAC'],
						firstSeen: s['First time seen'].trim(),
						lastSeen: s['Last time seen'].trim(),
						power: parseInt(s['Power']),
						packets: parseInt(s['# packets']),
						network: s['BSSID'].trim() == '(not associated)' ? null : s['BSSID'].trim(),
						probes: s['Probed ESSIDs'].trim().split(',').filter(x => x != '')
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
