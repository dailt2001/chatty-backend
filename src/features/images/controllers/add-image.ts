import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UserCache } from '@service/redis/user.cache';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { addImageSchema } from '@image/schemes/image.scheme';
import { BadRequestError } from '@global/helpers/error-handler';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import { IUserDocument } from '@user/interfaces/user.interface';
import { socketIOImageObject } from '@socket/image';
import { imageQueue } from '@service/queues/image.queue';
import { Helpers } from '@global/helpers/helpers';
import { IBgUploadResponse } from '@image/interfaces/image.interface';

const userCache: UserCache = new UserCache();

export class Add {
    @joiValidation(addImageSchema)
    public async profileImage(req: Request, res: Response): Promise<void> {
        const result: UploadApiResponse = (await uploads(req.body.image, req.currentUser!.userId, true, true)) as UploadApiResponse;
        if (!result?.public_id) {
            throw new BadRequestError('File upload: Error occurred. Try again.');
        }
        const url = `https://res.cloudinary.com/dyamr9ym3/image/upload/v${result.version}/${result.public_id}`;
        const cachedUser: IUserDocument | null = (await userCache.updateSingleUserItemInCache(
            req.currentUser!.userId,
            'profilePicture',
            url
        )) as IUserDocument;
        socketIOImageObject.emit('update user', cachedUser);
        imageQueue.addImageJob('addUserProfileImageToDB', {
            key: `${req.currentUser!.userId}`,
            value: url,
            imgId: result.public_id,
            imgVersion: result.version.toString()
        });
        res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
    }

    @joiValidation(addImageSchema)
    //option 1: upload new image : image send to backend->base64:  data:dafghdfghfgdjfghk....
    //option2: upload previous image:image->string
    public async backgroundImage(req: Request, res: Response): Promise<void> {
        const { version, publicId }: IBgUploadResponse = await Add.prototype.backgroundUpload(req.body.image);
        const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
            `${req.currentUser!.userId}`,
            'bgImageId',
            publicId
        ) as Promise<IUserDocument>;
        const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
            `${req.currentUser!.userId}`,
            'bgImageVersion',
            version
        ) as Promise<IUserDocument>;
        const response: [IUserDocument, IUserDocument] = (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];
        socketIOImageObject.emit('update user', {
            bgImageId: publicId,
            bgImageVersion: version,
            userId: response[0]
        });

        imageQueue.addImageJob('updateBackgroundImageToDB', {
            key: `${req.currentUser!.userId}`,
            imgId: publicId,
            imgVersion: version.toString()
          });
        res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
    }

    private async backgroundUpload(image: string): Promise<IBgUploadResponse> {
        const isDataURL = Helpers.isDataURL(image);
        let version = '';
        let publicId = '';
        if (isDataURL) {
            // upload new image
            const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;
            if (!result.public_id) {
                throw new BadRequestError(result.message);
            } else {
                version = result.version.toString();
                publicId = result.public_id;
            }
        } else {
            const value = image.split('/');
            publicId = value[value.length - 1];
            version = value[value.length - 2];
        }
        return { version: version.replace(/v/g, ''), publicId };
    }
}
