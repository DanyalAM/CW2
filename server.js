// load Express.js 
const express = require('express');
const app = express();
const webpush = require('web-push');

// load bodyParser module for json payload parsing 
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});


// connect to MongoDB 
const MongoClient = require('mongodb').MongoClient;
let db;
MongoClient.connect('mongodb://localhost:27017/', (err, client) => {
    db = client.db('brainHive')
})

app.listen(3000);

let vapidKeys = {
    publicKey: 'BAetXY39GfoXVKtrzmz1X7nDzYYxMK9VxhDrFYkdA7dXOiaVpngpEAL2nHz8utgHRB69GTlUbTvtJUoqLNMY8iA',
    privateKey: 'DwiwJ9Y1Y-RD3kpDRL73Jh1sShF8cD-5eb9QzOO1fKQ'
}

webpush.setVapidDetails('mailto:test@code.co.uk', vapidKeys.publicKey, vapidKeys.privateKey);


app.post('/collections/:collectionName/postKeys-:email', (req, res, next) => {

    db.collection('Users').findOne({ email: req.params.email },
        (e, result) => {
            if (e) return next(e)

            //delete all other sessions this user might have had
            //this is to ensure their old subs are not kept as trash
            db.collection('Subscriptions').deleteMany({ userID: ObjectID(result._id) });
            //append userID to the body so we can identify each user's subscription
            req.body.userID = result._id;

            db.collection('Subscriptions').insertOne(req.body, (err, success) => {
                if (err) return next(err)

                res.send("success");
            })

        })
})


//webpush.sendNotification(sub, 'test message');

app.get('/collections/firstCache/:email-:code', (req, res) => {

    db.collection('Users').findOne({ email: req.params.email },
        (e, result) => {
            if (e) return next(e)

            db.collection('Subscriptions').findOne({ userID: result._id },
                (err, success) => {
                    if (e) return next(e)

                    delete success["userID"];

                    if (req.params.code == 1) {
                        webpush.sendNotification(success, JSON.stringify(
                            {
                                body: 'Cache Initialised for the First Time!',
                                icon: '/CW2/icons/icon-32.png',
                            })
                        );
                    }else{
                        webpush.sendNotification(success, JSON.stringify(
                            {
                                body: 'Using Previously Stored Cache!',
                                icon: '/CW2/icons/icon-32.png',
                            })
                        );
                    }
                    res.send(success);
                })
        })
})

// get the collection name 
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})

//get user from the database by email
//if this returns any array with a length > 0 then that email already exists
app.get('/collections/:collectionName/:email', (req, res) => {
    req.collection.find({ 'email': req.params.email }).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
})

//this gets received the user's registeration information
//and then that's saved into the Users collection on mongodb
app.post('/addUser', (req, res, next) => {

    //insert into the users collection the body that was sent with the request
    db.collection('Users').insertOne(req.body, (e, results) => {
        if (e) return next(e)
    })

    //send response success
    res.send("Success");
})


app.get('/collections/:email-:password', function (req, res) {
    db.collection('Users').find({ '$and': [{ 'email': req.params.email }, { 'password': req.params.password }] }).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
})

// used to retrieve all the subjects we provide
app.get('/collections/:collectionName', (req, res) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
})


//using the product key to identify a product
const ObjectID = require('mongodb').ObjectID;
app.get('/retrieveProd/:collectionName/:id', (req, res, next) => {
    db.collection('Products').findOne({ _id: new ObjectID(req.params.id) },
        (e, result) => {
            if (e) return next(e)
            res.send(result)
        })
})

app.put('/collections/:collectionName/:userID-:type', (req, res) => {
    //there are five rating fields (rating5, rating4... ), these need to be updated as per the given rating
    //so we store that in a variable to use as a property
    var ratingsField = "Ratings.rated" + req.body.givenRating;

    if (req.params.type == "newRanking") {
        //put the rated product into the user's userCrumbs array
        //this arrays keeps tracks of the user's 'crumbs' or trail, so we know what they've already liked
        db.collection('Users').updateOne({ _id: new ObjectID(req.params.userID) },
            {
                '$push': { "userCrumbs": req.body.productID }
            })


        //$inc allows to increment or decrement values by a specified amount
        db.collection('Products').updateOne({ _id: new ObjectID(req.body.productID) },
            {
                $push: { "RatingHistory": { "raterID": req.params.userID, "givenRating": req.body.givenRating } },
                $inc: { [ratingsField]: +1, "Raters": +1 },
                $set: { "AvgRating": req.body.avgRating }
            });
    } else if (req.params.type == "updateRanking") {

        var oldRatingsField = "Ratings.rated" + req.body.oldRating;

        //this code allows us to update a particular array field without knowing it's index
        //we feed it the user's ID, and it identifies the position and updates their previous ranking
        db.collection('Products').updateOne({ $and: [{ _id: new ObjectID(req.body.productID) }, { "RatingHistory.raterID": req.params.userID }] },
            {
                $set: { "RatingHistory.$.givenRating": req.body.givenRating, "AvgRating": req.body.avgRating },
            });

        //there is an issue with using this command on the query above, so we do it separetely
        //otherwise only the last value is decremented, whereas we want the first one to be incremented
        //AND the last one to be decremented
        db.collection('Products').updateOne({ _id: new ObjectID(req.body.productID) },
            {
                $inc: { [ratingsField]: +1, [oldRatingsField]: -1 }
            });
    }

    res.send("success");
})

//this route will allow providers to post their courses
//and we'll also link it to the correct provider so we can show all
//their available products in one place
app.post('/collections/:collectionName/:userID', (req, res, next) => {

    req.collection.insertOne(req.body, (e, results) => {

        db.collection('Users').update({ _id: new ObjectID(req.params.userID) },
            {
                '$push': { "userProducts": results.insertedId }
            });
        if (e) return next(e)
    })

    //send response success
    res.send("Success");
})

//using the product key to identify a product
app.get('/collections/:collectionName/allProvided/:id', (req, res, next) => {

    //since we're unaware of the id's of each course the provider hosts
    //we'll have to build up an array of ids with a query to the user's product information
    //then we can use that array of ids to generate our own query to pass to the products
    //db
    var query = { "$in": [] };

    db.collection('Users').findOne({ "_id": new ObjectID(req.params.id) },
        (e, result) => {
            for (var i = 0; i < result.userProducts.length; i++) {
                query.$in.push(ObjectID(result.userProducts[i]));
            }

            db.collection('Products').find({
                "_id": query
            }).toArray((e, result) => {
                res.send(result);
            })
        })
})


// delete a lesson by ID 
app.delete('/collections/:collectionName/:productID', (req, res, next) => {

    //remove the product from the products collection
    req.collection.deleteOne(
        { "_id": ObjectID(req.params.productID) }
    );

    //remove the product from the user's 'userProducts' array in the users collection
    db.collection('Users').updateOne(
        { "_id": new ObjectID(req.body.userID) },
        { "$pull": { 'userProducts': new ObjectID(req.params.productID) } }
    )

    //additionally we'll want to remove the product from every user's liked products, because it no longer exists
    db.collection('Users').updateMany(
        {},
        { "$pull": { 'userCrumbs': req.params.productID } }
    )

    res.send("success");
})


app.put('/collections/updateLesson/:collectionName/:prodID', (req, res) => {

    //we get the id from the url parameter, and from there we set the entire document (ignoring the id)
    //to the values send in the body
    //the body sends the entire product object so we dont have to explicitly change each changed value, we
    //change the entire object regardless of whether changes were made or not
    req.collection.updateOne({ "_id": ObjectID(req.params.prodID) },
        {
            "$set": req.body
        });

    res.send("success");
})

