const mongoose = require("mongoose");
const initalizedata = require("./data");
const Listing  = require("../listing.js") ;

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";


main().then(()=>{
    console.log("connected to db ");
})
.catch((err)=>{
    console.log(err);
});

async function main (params) {
    await mongoose.connect(MONGO_URL);}

const initDB = async ()=>{
    await Listing.deleteMany({});
    initalizedata.data = initalizedata.data.map((obj) => ({ ...obj ,owner :"68a0bf5ea5c347f3b872da0d"}));
    await Listing.insertMany(initalizedata.data);
    console.log("data was initialized");
}

initDB();
