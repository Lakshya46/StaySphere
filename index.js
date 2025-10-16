const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const engine = require('ejs-mate');
const methodoverride = require("method-override");
const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRoute = require("./routes/booking.js");

const session = require('express-session');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const MongoStore = require("connect-mongo");
require('dotenv').config();


const dbUrl = process.env.ATLASDB_URL ;


async function main (params) {
    await mongoose.connect(dbUrl
       
      
    );

}

main().then(() => {
    console.log("MongoDB connection successful");
}).catch((err) => {
    console.log("MongoDB connection error:", err);
});

app.engine('ejs', engine);
app.set("view engine" ,"ejs");
app.set("views" , path.join(__dirname , "views"));
app.use(express.urlencoded({extended : true}));
app.use(methodoverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));




const store = MongoStore.create({
    mongoUrl :dbUrl ,
    crypto : {
        secret : process.env.SECRET ,
    }
    ,
    touchAfter : 24 * 3600 
    
});


store.on("error" , (err )=>{
    console.log("error in mongo session store" , err);

})

const sessionOptions = {
    store ,
    secret : process.env.SECRET,
    resave : false ,
    saveUninitialized : true ,
    cookie : {
        expires : Date.now()+ 7 * 24 *60 *60 *1000 ,
        maxAge : 7*24*60*60*1000 ,
        httpOnly :true
    }

}



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: "email" }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentuser = req.user;
    next();
});


app.get('/', (req, res) => {
    res.redirect("/listings")
});
app.use("/listings" ,listingRouter);
app.use("/listings/:id/reviews/" ,reviewRouter );
app.use("/users" , userRouter);
app.use("/listings/:id/booking", bookingRoute);

// Endpoint to serve Geoapify API key
app.get("/api/geoapify-key", (req, res) => {
    res.json({ apiKey: process.env.GEOAPIFY_SECRET });
});



app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});


app.use( ( err , req ,res ,next) =>{

     res.render("error.ejs" , { err});
});



const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});


