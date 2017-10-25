var express = require('express');
var router = express.Router();
var mysql = require('mysql');

/* GET home page. */
router.get('/search', function(req, res) {
    var db = req.query.db;
    var id = req.query.id;
    if (!db || !id) return res.json({"error": "missing parameter !"});

    var query = 'SELECT * FROM form where id = ' + id;
    var cred = {
        host     : 'localhost',
        user     : 'root',
        password : 'BBBF12C',
        database : db
    };
    var connection = mysql.createConnection(cred);
    connection.query(query, function (error, results) {
        if (error) return res.status(404).json({"error" : "missing/bad parameters or the db doesn\'t exist"});
        else return results.length > 0 ?
            res.status(200).json(results[0]) : res.status(404).json({ "info" : "no result for this entry !"});
    });
});

module.exports = router;
