const macLookup = require('mac-lookup')
const { spawn } = require('child_process')

function updateVendorMacs(callback) {
	// curl -f -L -o node_modules/mac-lookup/oui.txt https://linuxnet.ca/ieee/oui.txt
	console.log('[verbose] downloading mac vendor dataset...')
	curl = spawn('curl', ['-f', '-L', '-o', 
						  'node_modules/mac-lookup/oui.txt', 
						  'https://linuxnet.ca/ieee/oui.txt'])

	curl.on('close', (code) => {
  		if (code != 0) {
  			console.error(`[error] command "curl -f -L -o ` +
  				          `node_modules/mac-lookup/oui.txt https://linuxnet.ca/ieee/oui.txt" ` +
  				          `failed with exit code ${code}`)
  			callback()
  		} else {
  			console.log('[verbose] rebuilding sqlite3 mac vendor database...')
  			macLookup.rebuild((err) => {
				// WARNING! THIS NEVER FIRES, WTF!!! Seems like the library eats
				// this callback. Shame!
				if (err) {
					console.error('[error] error building oui.db sqlite3 database')
					console.error(err)
				}

				console.log('[verbose] rebuilt sqlite3 mac vendor database')
				callback()
			})
  		}
	})
}

module.exports = {
	updateVendorMacs
}