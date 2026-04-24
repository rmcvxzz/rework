const { lbpError } = require('./error');

function sendXml(res, xml, status = 200) {
    return res
        .status(status)
        .set('Content-Type', 'application/xml')
        .send(xml);
}

function sendError(res, id, message, status = 400) {
    return res
        .status(status)
        .set('Content-Type', 'application/xml')
        .send(lbpError(id, message));
}

module.exports = {
    sendXml,
    sendError
};