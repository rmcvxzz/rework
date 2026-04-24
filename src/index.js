require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/levels', require('./routes/levels'));
app.use('/session', require('./routes/session'));
app.use('/servers', require('./routes/servers'));
app.use('/news_feed', require('./routes/news'));
app.use('/policies', require('./routes/policies'));
app.use('/players', require('./routes/players'));

app.get('/', (req, res) => {
    res.send('LBPK Server Running');
});

app.listen(process.env.PORT, () => {
    console.log(`Rework Server running on port ${process.env.PORT}`);
});