/*
    Adeunis FTD Chirpstack decoder
    Author matt@econode.nz 25/06/2022
    FTD Manual with payload structure https://www.adeunis.com/wp-content/uploads/2020/03/User_Guide_FTD_LoRaWAN_AS923_V1.0.1.pdf
*/
function Decode(fPort, bytes, variables) {
    const lookup = {
        'gpsQuality': ['','Good','Average','Poor']}
    var response = {}
    var status = bytes[0]
    response.frameStatus = '0x'+padZeros(status.toString(16),2)
    var payload = ""
    for( var idx = 0; idx<bytes.length; idx++ ) payload += "0x"+padZeros( bytes[idx].toString(16),2 )+","
    response.payload = payload.slice(0,-1)
    response.fPort = fPort
    if(status & 0x80) response.temperatureC = bytes[1] & 0x80 ? bytes[1]-256 : bytes[1]
    if(status & 0x40) response.trigger = "accelerometer"
    if(status & 0x20) response.trigger = "pushbutton"
    if(status & 0x10){
        const latDegrees = parseInt(bytes[1].toString(16))
        const latMinutes = parseInt(bytes[2].toString(16))
        const latThou = padZeros( parseInt(bytes[3].toString(16))*100+parseInt( (bytes[4]>>4).toString(16))*10 ,4)
        var latNS = bytes[4]&0x01 ? 'S':'N'
        response.latitude_ddm = latDegrees+' '+latMinutes+'.'+latThou+' '+latNS
        var longDegrees = (parseInt(bytes[5].toString(16))*10)+parseInt((bytes[6]>>4).toString(16))
        var longMinutes = (parseInt((bytes[6]&0x0F).toString(16))*10)+parseInt((bytes[7]>>4).toString(16))
        var longHundreths = padZeros(parseInt((bytes[7]&0x0F).toString(16)*100)+parseInt((bytes[8]>>4).toString(16))*10,3)
        var longEW = bytes[8]&0x01 ? 'W':'E'
        response.longitude_ddm = longDegrees+' '+longMinutes+'.'+longHundreths+' '+longEW
        response.gpsQuality = parseInt( (bytes[9]>>4) & 0x03 )
        response.gpsQualityText = lookup. gpsQuality[response.gpsQuality]
        response.satelliteCount = parseInt(bytes[9]&0x0F)
        var latDD = parseFloat(latDegrees) + parseFloat((parseFloat(latMinutes+"."+latThou) /60).toFixed(5))
        response.latitude_dd = latDD * (latNS=='N'?1:-1)
        var longDD = parseFloat(longDegrees) + parseFloat((parseFloat(longMinutes+"."+longHundreths) /60).toFixed(5))
        response.longitude_dd = longDD * (longEW=='E'?1:-1)
    }
    if(status & 0x08) response.uplink = bytes[2]
    if(status & 0x04) response.downlink = bytes[3]
    if(status & 0x02) response.battery = parseFloat((bytes[4]<<8 | bytes[5]) / 1000)
    if(status & 0x01){
        response.rssi = bytes[6] * -1
        response.snr = bytes[7]
    }
    return response
}

function padZeros(num, size) {
    return String("000000000" + num ).slice(size * -1 ).toUpperCase()
}