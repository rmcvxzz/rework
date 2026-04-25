function lbpResponse(innerXml) {
    const clean = innerXml.trim(); 

    return '<?xml version="1.0" encoding="UTF-8"?>' +
'<result>' +
'<status>' +
'<id>0</id>' +
'<message>Successful completion</message>' +
'</status>' +
'<response>' +
clean +
'</response>' +
'</result>';
}

module.exports = { lbpResponse };