import { IFileImageJobData } from '@image/interfaces/image.interface';
import { imageWorker } from '@worker/image.worker';
import { BaseQueue } from './base.queue';


class ImageQueue extends BaseQueue{
    constructor(){
        super('image');// set the name of the queue
        this.processJob('addUserProfileImageToDB',5, imageWorker.addUserProfileImageToDB);
        this.processJob('updateBackgroundImageToDB',5, imageWorker.updateBackgroundImageToDB);
        this.processJob('removeImageFromDB',5, imageWorker.removeImageFromDB);
        this.processJob('addImageToDB',5, imageWorker.addImageToDB);
    }
    public addImageJob(name: string, data: IFileImageJobData): void {
        this.addJob(name, data);
    }
}

export const imageQueue: ImageQueue = new ImageQueue();