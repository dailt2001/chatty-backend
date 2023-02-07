import { config } from '@root/config';
import { chatService } from '@service/db/chat.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('chatWorker');

class ChatWorker{
    public async addChatMessageToDB(job: Job, done: DoneCallback): Promise<void>{
        try{
            await chatService.addMessageToDB(job.data);
            job.progress(100);
            done(null, job.data);  
        }catch(error){
            log.error(error);
            done(error as Error);
        }
    }

    public async markMessageAsDeleted(job: Job, done: DoneCallback): Promise<void>{
        try{
            const { messageId, type } = job.data;
            await chatService.markMessageAsDeleted(messageId, type);
            job.progress(100);
            done(null, job.data);  
        }catch(error){
            log.error(error);
            done(error as Error);
        }
    }

    async markMessagesAsReadInDB(jobQueue: Job, done: DoneCallback): Promise<void> {
        try {
          const { senderId, receiverId } = jobQueue.data;
          await chatService.markMessagesAsRead(senderId, receiverId);
          jobQueue.progress(100);
          done(null, jobQueue.data);
        } catch (error) {
          log.error(error);
          done(error as Error);
        }
      }
    
      async updateMessageReaction(jobQueue: Job, done: DoneCallback): Promise<void> {
        try {
          const { messageId, senderName, reaction, type } = jobQueue.data;
          await chatService.updateMessageReaction(messageId, senderName, reaction, type);
          jobQueue.progress(100);
          done(null, jobQueue.data);
        } catch (error) {
          log.error(error);
          done(error as Error);
        }
      }
}

export const chatWorker: ChatWorker = new ChatWorker();