var express = require('express'),
    path = require('path'),
    app = express(),
    MongoClient = require('mongodb').MongoClient,
    dbUrl = 'mongodb://<db_username>:<password>@ds113580.mlab.com:13580/freecodecamp_1',
    Bing = require('node-bing-api')({ accKey: "<bingo-search-image-api-key>" });

// Listen port
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

// Include home page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Search image
app.get('/api/imgSearch/:name', function(req, res) {
    var page = req.query.offset ? req.query.offset : 1,
        inquiry = req.params.name,
        date = new Date().toISOString(),
        result = [];
    Bing.images(inquiry, { top: page, skip: 0 }, function(err, response, body) {
        if (err) res.send('The number of requests is 1000 for the current month. The residue is 0. Try the following month.');
        else {
            for (var i = 0; i < page; i++)
                result.push({
                    "url": body.value[i].contentUrl,
                    "snippet": body.value[i].name,
                    "thumbnail": body.value[i].thumbnailUrl,
                    "context": body.value[i].hostPageUrl
                });
            MongoClient.connect(dbUrl, function(err, db) {
                if (err) {
                    result.unshift({"error": "Database Error! The session is not saved!"});
                    res.send(result);
                }
                else db.collection('list2').insert([{ term: inquiry, when: date }], function(err, docs) {
                    if (err) {
                        result.unshift({"error": "Database Error! The session is not saved!"});
                        res.send(result);
                    }
                    else res.send(result);
                    db.close();
                });
            });
        }
    });
});

// Latest search
app.get('/api/latest/imgSearch', function(req, res) {
    MongoClient.connect(dbUrl, function(err, db) {
        if (err) res.send('DataBase Error!');
        else db.collection('list2').find({}, { _id: 0 }).sort({ _id: -1 }).limit(10).toArray(function(err, docs) {
            if (err) res.send('DataBase Error!');
            else res.send(docs);
            db.close();
        });
    });
});
