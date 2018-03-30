const EventEmitter = require('events')
const path = require('path')
const fs = require('fs')

class DNSParser extends EventEmitter {

	constructor() {
		super()
		this.adHosts = parseHostFiles()
	}

	// parse a line from `tcpdump udp port 53` command
	parse(line) {
		const domains = parseDNSRequests(line)
		if (domains) {
			domains.forEach(domain => {
				const dnsObj = {
					domain,
					blocked: this.adHosts.hasOwnProperty(domain)
				}
				this.emit('dns-request', dnsObj)
			})
		}
	}
}

function parseHostFiles() {
	const hosts = {}
	// hosts grabbed from here
	// https://github.com/AdAway/AdAway/wiki/HostsSources
	let hostfiles = fs.readdirSync(path.join(__dirname, '..', 'data', 'hosts'))
	hostfiles = hostfiles.map(file => path.join(__dirname, '..', 'data', 'hosts', file))
	hostfiles.forEach(file => {
		const lines = fs.readFileSync(file).toString().split('\n')
		lines.forEach(line => {
			line = line.trim()
			// if this isn't a comment
			if (line[0] != '#') {
				host = line.split(/\s/)[1]
				if (host && !hosts.hasOwnProperty(host)) {
					hosts[host] = null
				}
			}
		})
	})
	return hosts
}

// return an array of domain name
function parseDNSRequests(line) {

	const matches = line.match(/(A\?|AAAA\?|CNAME) [^, ]+(,| )/g)
	const domains = []
	if (matches) {
		matches.forEach(match => {
			// remove A?, AAAA?, CNAME at beginning and '. ' or '.,' at end
			domains.push(match.replace(/(A\?|AAAA\?|CNAME) /, '').slice(0, -2))
		})
	}

	return domains
}

module.exports = {
	DNSParser
}
