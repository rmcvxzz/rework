function lbpError(id, message) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<result>
  <status>
    <id>${id}</id>
    <message>${message}</message>
  </status>
  <response></response>
</result>`;
}

module.exports = { lbpError };