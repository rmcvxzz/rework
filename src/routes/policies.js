const express = require('express');
const router = express.Router();
const path = require('path');
const { lbpResponse } = require('../utils/xml');
const { sendXml } = require('../utils/respond');

// Spec file — game reads this first
router.get('/policy.view.xml', (req, res) => {
    const filePath = path.join(process.cwd(), 'src', 'templates', 'policy.view.xml');
    console.log('Looking for file at:', filePath);
    res.set('Content-Type', 'text/xml');
    res.sendFile(filePath);
});

// Actual policy data endpoint
router.get('/view.xml', (req, res) => {
    const { policy_type = 'EULA' } = req.query;

    const policyName =
        policy_type === 'PRIVACY'
            ? 'Rework Privacy Policy'
            : 'Rework Participation Agreement';

    const policyText = `
Hello and welcome to Rework!
You might wanna change this.
GitLab repo:
https://gitlab.com/rmcvxzz/rework
Rework is made by rmcvxzz.
`;

    const xml = lbpResponse(`
  <policy 
    id="21"
    is_accepted="false"
    name="${policyName}"
  >${policyText}</policy>
    `);

    return sendXml(res, xml);
});

module.exports = router;