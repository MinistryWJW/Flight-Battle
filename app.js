const express = require('express')
const app = express();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
})
app.use(express.static(__dirname + '/static'))
const port = 33333
app.listen(port)
console.info(`listen at port ${port}`)
require('child_process').exec('start http://localhost:'+port)