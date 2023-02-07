import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { commentService } from '@service/db/comment.service';

const log: Logger = config.createLogger('authWorker');

class CommentWorker {
    async addCommentToDB(job: Job, done: DoneCallback): Promise<void>{
        try{
            const { data } = job;
            //add method to send data to database
            await commentService.addCommentToDB(data);
            job.progress(100);
            done(null, data);
        }catch(error){
            log.error(error);
            done(error as Error);
        }
    }
}

export const commentWorker: CommentWorker = new CommentWorker();
