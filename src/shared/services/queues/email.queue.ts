import { IEmailJob } from '@user/interfaces/user.interface';
import { emailWorker } from '@worker/email.worker';
import { BaseQueue } from './base.queue';


class EmailQueue extends BaseQueue{
    constructor(){
        super('queue name: email');
        this.processJob('forgotPasswordEmail', 5, emailWorker.addNotificationEmail);
        this.processJob('commentsMail', 5, emailWorker.addNotificationEmail);
        this.processJob('followersMail', 5, emailWorker.addNotificationEmail);
        this.processJob('reactionsMail', 5, emailWorker.addNotificationEmail);
        this.processJob('directMessageMail', 5, emailWorker.addNotificationEmail);
    }

    public addEmailJob(name: string, data: IEmailJob): void{
        this.addJob(name, data);
    }
}

export const emailQueue: EmailQueue = new EmailQueue();