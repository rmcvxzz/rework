const express = require('express');
const router = express.Router();
const { lbpResponse } = require('../utils/xml');

router.get('/view.xml', (req, res) => {
    const { policy_type = 'EULA' } = req.query;

    // You can customize this later
    let policyName = 'Rework Participation Agreement';

    if (policy_type === 'PRIVACY') {
        policyName = 'Privacy Policy';
    }

    const xml = lbpResponse(`
  <policy 
    id="21"
    is_accepted="true"
    name="${policyName}"
  />
    `);

    res.set('Content-Type', 'application/xml');
    res.send(xml);
});

module.exports = router;