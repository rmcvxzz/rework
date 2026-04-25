const express = require('express');
const router = express.Router();

function normalizeIP(ip) {
    if (!ip) return '127.0.0.1';
    if (ip.includes('::ffff:')) return ip.replace('::ffff:', '');
    if (ip === '::1') return '127.0.0.1';
    return ip;
}

// Game fetches this first to know how to call preferences.xml
router.get('/preferences.update.xml', (req, res) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<resource name="preferences.update">
  <request method="POST" url="resources/preferences.xml">
    <param name="preference[language_code]" type="string" required="false" options="en-us,en-gb,es,es-mx,da,de,fi,fr,it,ja,ko,nl,pt,pt-br,ru,sv,no,zh-cn,zh-tw,pl"/>
    <param name="preference[timezone]" type="string" required="false"/>
    <param name="preference[region_code]" type="string" required="false" options="scea,scee,scej,sceasia,scek,sceeuk,scesa"/>
    <param name="preference[domain]" type="string" required="false"/>
  </request>
  <response name="response" type="anchor">
    <element name="preferences" type="Hash">
      <attribute name="language_code" type="string"/>
      <attribute name="domain" type="string"/>
      <attribute name="ip_address" type="string"/>
      <attribute name="region_code" type="string"/>
      <attribute name="timezone" type="string"/>
    </element>
  </response>
</resource>`;

    res.set('Content-Type', 'text/xml');
    res.status(200).send(xml);
});

// Game POSTs here after reading the spec
router.post('/preferences.xml', (req, res) => {
    const ip = normalizeIP(req.ip);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <id>0</id>
        <message>Successful completion</message>
    </status>
    <response>
        <preferences language_code="en-us" timezone="-500" region_code="scea" domain="localhost" ip_address="${ip}" />
    </response>
</result>`;

    res.set({
        'Content-Type': 'text/xml',
        'Connection': 'keep-alive'
    });

    res.cookie('playco',
        'BAh7C0kiD3Nlc3Npb25faWQGOgZFRiJFZHVtbXkxMjM0NTY3ODkwIi1zaWduYXR1cmU=',
        {
            httpOnly: true,
            path: '/'
        }
    );

    res.status(200).send(xml);
});

module.exports = router;