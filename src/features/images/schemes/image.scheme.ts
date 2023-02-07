import Joi from 'joi';
import joi, { ObjectSchema } from 'joi';

const addImageSchema: ObjectSchema = joi.object().keys({
    image: Joi.string().required()
});

export { addImageSchema };