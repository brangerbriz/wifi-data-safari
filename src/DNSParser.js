const EventEmitter = require('events')

class DNSParser extends EventEmitter {

	constructor() {
		super()
	}

	// parse a line from `tcpdump udp port 53` command
	parse(line) {
		const domains = parseDNSRequests(line)
		if (domains) {
			domains.forEach(domain => this.emit('dns-request', domain))
		}
	}
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
