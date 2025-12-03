const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();
console.log("Cloudinary ENV:", process.env.CLOUD_NAME, process.env.CLOUD_API_KEY ? "KEY_SET" : "NO_KEY", process.env.CLOUD_API_SECRET ? "SECRET_SET" : "NO_SECRET");

cloudinary.config({
    cloud_name : process.env.CLOUD_NAME ,
    api_key : process.env.CLOUD_API_KEY ,
    api_secret : process.env.CLOUD_API_SECRET 
});

cloudinary.api.ping()
  .then(result => console.log("Cloudinary connected:", result))
  .catch(err => console.error(" Cloudinary connection failed:", err));

const storage = new CloudinaryStorage({
   cloudinary,
  params: {
    folder: "staysphere",
    allowed_formats : ["png" , "jpg" , "jpeg"] 
  }
});
 

module.exports = { cloudinary , storage }