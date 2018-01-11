function getColor(){
    let mac = this.DataObj.mac.split(':')
    return `#${mac[0]}${mac[1]}${mac[2]}`
}

function formatSeconds(sec){
    if( sec > 60 ){
        // logic via https://stackoverflow.com/a/6313008/1104148
        let h   = Math.floor(sec / 3600)
        let m = Math.floor((sec - (h * 3600)) / 60)
        let s = sec - (h * 3600) - (m * 60)
        if( h > 0 ){
            return `${h} hours`
        } else {
            return `${m} minutes`
        }
    } else {
        return `${sec} seconds`
    }
}


function string2Date(str){
    let d = str.split(' ')
    let d0 = d[0].split('-')
    let d1 = d[1].split(':')
    return new Date(d0[0],d0[1],d0[2],d1[0],d1[1],d1[2])
}

function printSeen(firstSeen,lastSeen,type){
    if( firstSeen == lastSeen ){
        return `It's the first time seeing this ${type},`
    } else {
        let f = string2Date(firstSeen)
        let l = string2Date(lastSeen)
        let time = this.formatSeconds( (l-f)/1000 )
        return `This ${type} was last seen ${time} ago,`
    }
}

function printSecurity(privacy,cipher,auth){
    return `${privacy}-${auth} (${cipher})`
}
