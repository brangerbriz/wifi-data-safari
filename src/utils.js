const macLookup = require('mac-lookup')
const { spawn, spawnSync } = require('child_process')


function getNetInterfaces(){
	let data = spawnSync('ifconfig').stdout.toString()
	let nets = [], idx = 0
	// create multidimentional array of interaces info
	data.split('\n').forEach(s=>{
		if( !(nets[idx] instanceof Array)) nets[idx] = []
		if( s !== '' ) nets[idx].push( s )
		else idx++
	})
	// filter out empty arrays && map out just the interface name
	nets = nets.filter(nz=>nz.length>0).map(nz=>{
		return nz[0].split(/\s|:/)[0]
	})
	return nets
}


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
	updateVendorMacs,
    getNetInterfaces
}
