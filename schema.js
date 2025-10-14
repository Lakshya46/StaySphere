const Joi = require('joi');

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required().messages({
      "string.empty": "Title is required",
    }),
    description: Joi.string().required().messages({
      "string.empty": "Description is required",
    }),
    price: Joi.number().min(100).required().messages({
      "number.base": "Price must be a number",
      "number.min": "Price must be at least ₹100",
      "any.required": "Price is required",
    }),
    country: Joi.string().required().messages({
      "string.empty": "Country is required",
    }),
    city: Joi.string().required().messages({
      "string.empty": "City is required",
    }),
    area: Joi.string().required().messages({
      "string.empty": "Locality / Area is required",
    }),
    pincode: Joi.string().pattern(/^\d{6}$/).required().messages({
      "string.pattern.base": "Pincode must be 6 digits",
      "string.empty": "Pincode is required",
    }),
    featuredImage: Joi.object({
      url: Joi.string().required(),
      filename: Joi.string().allow(''),
    }).optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().required(),
        filename: Joi.string().allow(''),
      })
    ).optional(),
    propertyType: Joi.string().valid("Flat", "PG", "Studio").required().messages({
      "any.only": "Invalid property type",
      "any.required": "Property type is required",
    }),
    bhkType: Joi.when('propertyType', {
      is: 'Flat',
      then: Joi.string().valid("1BHK", "2BHK", "3BHK", "More").required().messages({
        "any.only": "Invalid BHK type",
        "any.required": "BHK type is required for flats",
      }),
      otherwise: Joi.optional(),
    }),
    
    bedrooms: Joi.alternatives().try(
  Joi.number().min(1),
  Joi.string().allow('').custom((value) => {
    if (value === '') return undefined;
    return parseInt(value, 10);
  })
)
.when('propertyType', { is: 'Flat', then: Joi.required() })
.messages({
  "number.base": "Bedrooms must be a number",
  "number.min": "Bedrooms must be at least 1",
  "any.required": "Bedrooms are required for Flats"
}),

bathrooms: Joi.alternatives().try(
  Joi.number().min(1),
  Joi.string().allow('').custom((value) => {
    if (value === '') return undefined;
    return parseInt(value, 10);
  })
)
.when('propertyType', { is: 'Flat', then: Joi.required() })
.messages({
  "number.base": "Bathrooms must be a number",
  "number.min": "Bathrooms must be at least 1",
  "any.required": "Bathrooms are required for Flats"
}),

    amenities: Joi.array().items(Joi.string().valid("WiFi", "AC", "Parking")).optional(),
    additionalInfo: Joi.string().allow(''),
    latitude: Joi.number().required().messages({
      "number.base": "Latitude must be a number",
      "any.required": "Latitude is required",
    }),
    longitude: Joi.number().required().messages({
      "number.base": "Longitude must be a number",
      "any.required": "Longitude is required",
    }),
    mapLink: Joi.string().uri().allow(''),
    availableFrom: Joi.date().iso().allow(null),
    availableTo: Joi.date().iso().allow(null),
    nearby: Joi.boolean().truthy('on').falsy(null).default(false),
  }).required()
});

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required().messages({
      "number.base": "Rating must be a number",
      "number.min": "Rating cannot be less than 1",
      "number.max": "Rating cannot be more than 5",
      "any.required": "Rating is required"
    }),
    comment: Joi.string().required().messages({
      "string.empty": "Comment is required"
    })
  }).required()
});

module.exports = { listingSchema, reviewSchema };
