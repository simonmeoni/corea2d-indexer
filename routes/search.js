var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var userEnv = process.env.USER_COREA2D;
var passwordEnv = process.env.PWD_COREA2D;

var phraseoQuery = 'SELECT norm_form,super_entry,definition,lexical_entry,normalized_form ' +
    'FROM form ' +
    'LEFT JOIN entry ON form.sense_id = entry.id ' +
    'LEFT JOIN corresp_sense_domain ON entry.id = corresp_sense_domain.sense_id ' +
    'LEFT JOIN domain ON corresp_sense_domain.domain_id = domain.id ' +
    'WHERE form.id =';
var lstQuery = 'SELECT pos,lemma,class,definition FROM form where id = ';

const databaseSchema = {
    LST: 'lexique_transdisciplinaire',
    PhrLG: 'lexique_phraseo'
};

/* GET home page. */
router.get('/search', function(req, res) {
    var db = req.query.db;
    var id = req.query.id;
    var query;
    if (!db || !id) return res.json({"error": "missing parameter !"});

    if( db === databaseSchema.LST){
        query = lstQuery + id;
    } else if (db === databaseSchema.PhrLG){
        query = phraseoQuery + id;
    } else {
        return res.status(404).json({ "info" : "the DB don't exist !"});
    }
    var cred = {
        host     : 'sql.atilf.fr',
        user     : userEnv,
        password : passwordEnv,
        database : db
    };
    var connection = mysql.createConnection(cred);
    connection.query(query, function (error, results) {
        if (error) return res.status(404).json({"error" : "missing/bad parameters or the db doesn\'t exist"});
        else return results.length > 0 ?
            res.status(200).json(results[0]) : res.status(404).json({ "info" : "no result for this entry !"});
    });
    connection.end()
});

module.exports = router;
