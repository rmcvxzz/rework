function lbpResponse(innerXml) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<result>
  <status>
    <id>0</id>
    <message>Successful completion</message>
  </status>
  <response>
${innerXml}
  </response>
</result>`;
}

module.exports = { lbpResponse };