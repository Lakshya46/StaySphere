const Joi = require('joi');

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required().min(0),
        country: Joi.string().required(),
        city: Joi.string().required(),
        area: Joi.string().required(),
        featuredImage: Joi.object({
            url: Joi.string().required(),
            filename: Joi.string().allow('')
        }).optional(),
        images: Joi.array().items(
            Joi.object({
                url: Joi.string().required(),
                filename: Joi.string().allow('')
            })
        ).optional(),
        propertyType: Joi.string().valid("Apartment/Flat", "House", "PG", "Homestay").required(),
        bhkType: Joi.string().valid("1BHK", "2BHK", "3BHK", "4BHK+", "Studio").required(),
        bedrooms: Joi.number().min(1).required(),
        bathrooms: Joi.number().min(1).required(),
        amenities: Joi.array().items(Joi.string().valid("WiFi", "AC", "Parking")).optional(),
        additionalInfo: Joi.string().allow(''),
        mapLink: Joi.string().uri().allow('')
    }).required()
});

const reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required()
    }).required()
});

module.exports = { listingSchema, reviewSchema };


