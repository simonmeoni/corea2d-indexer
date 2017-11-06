var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});
var userEnv = process.env.USER_COREA2D;
var passwordEnv = process.env.PWD_COREA2D;
var sqlEnv = process.env.SQL_COREA2D;

var phraseoQuery = 'SELECT norm_form,super_entry,definition,lexical_entry,normalized_form ' +
    'FROM form ' +
    'LEFT JOIN entry ON form.sense_id = entry.id ' +
    'LEFT JOIN corresp_sense_domain ON entry.id = corresp_sense_domain.sense_id ' +
    'LEFT JOIN domain ON corresp_sense_domain.domain_id = domain.id ' +
    'WHERE form.id =';
var lstQuery = 'SELECT pos,lemma,class,definition FROM form where id = ';

var ctQuery = {
    term: {
        "query": {
            "match_phrase": {
                "id": 0
            }
        }
    },
    variations: {
        "query": {
            "match_phrase": {
                "variant": "key"
            }

        }
    }
};
const databaseSchema = {
    LST: 'lexique_transdisciplinaire',
    PhrLG: 'lexique_phraseo',
    CTA: 'terminology-archeo',
    CTC: 'terminology-chimie',
    CTL: 'terminology-ling'
};

function formatElasticQuery(hits,db,f,res){
    var json = {};
    var key = hits._source.key;
    json.POS = key.split(':')[0];
    json.lemma = key.split(':')[1].trim();
    f(key,json,db,res);
}

function searchVariants(key,json,db,res){
    ctQuery.variations.query.match_phrase.variant = key;
    client.search({
        index: db,
        type: 'variations',
        body: ctQuery.variations
    }).then(function (resp) {
        var result = resp.hits.hits;
        if (result.length > 0){
            json.type = "variante";
            json.forme_canonique = "";
            result.forEach(function(el) {json.forme_canonique += el._source.base + ", "});
            json.forme_canonique = json.forme_canonique.slice(0,-2);
        } else {
            json.type = "forme canonique";
        }
        return res.status(200).send(json)
    }).catch(function (err){
        json.error = "problem with variations";
        return "test";
    });
}

function searchOnElastic(id,db,res){
    ctQuery.term.query.match_phrase.id = id;
    client.search({
        index: db,
        type: 'terms',
        body: ctQuery.term
    }).then(function (resp) {
        return resp.hits.hits.length > 0 ?
            formatElasticQuery(resp.hits.hits[0],db,searchVariants,res):
            res.status(404).json({ "info" : "no result for this entry !"});
    }).catch(function (err){
        return res.status(404).json({"error" : "missing/bad parameters or the db doesn\'t exist"});
    });
}

function searchOnSql(query,db,res){
    var cred = {
        host     : sqlEnv,
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
}
/* GET home page. */
router.get('/search', function(req, res) {
    var db = req.query.db;
    var id = req.query.id;
    if (!db || !id) return res.json({"error": "missing parameter !"});

    if (db === (databaseSchema.CTA || databaseSchema.CTC || databaseSchema.CTL)){
        searchOnElastic(id,db,res)
    } else if( db === databaseSchema.LST){
        searchOnSql(lstQuery + id,db,res);
    } else if (db === databaseSchema.PhrLG){
        searchOnSql(phraseoQuery + id,db,res);
    } else {
        return res.status(404).json({ "info" : "the DB don't exist !"});
    }
});

module.exports = router;
