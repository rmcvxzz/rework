const express = require('express');
const router = express.Router();
const { lbpResponse } = require('../utils/xml');
const { sendXml } = require('../utils/respond');

router.get('/view.xml', (req, res) => {
    const { policy_type = 'EULA' } = req.query;

    const policyName =
        policy_type === 'PRIVACY'
            ? 'Rework Privacy Policy'
            : 'Rework Participation Agreement';

    const xml = lbpResponse(`
  <policy 
    id="21"
    is_accepted="true"
    name="${policyName}"
  />
    `);

    return sendXml(res, xml);
});

module.exports = router;