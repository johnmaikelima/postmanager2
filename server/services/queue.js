import Queue from 'bull';
import cron from 'node-cron';
import facebookService from './facebook.js';

let postQueue;

export async function setupQueues() {
  try {
    // Configurar fila de posts
    postQueue = new Queue('post-publishing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    // Processar jobs da fila
    postQueue.process(async (job) => {
      const { message, imagePath, scheduledTime, targetPageId, targetPageIds } = job.data;
      
      console.log(`Processing post job ${job.id}...`);
      
      try {
        const pageIds = Array.isArray(targetPageIds) && targetPageIds.length > 0
          ? targetPageIds
          : [targetPageId].filter(Boolean);

        if (pageIds.length === 0) {
          const result = imagePath
            ? await facebookService.publishPhotoPost(message, imagePath)
            : await facebookService.publishTextPost(message);
          console.log(`Post published successfully: ${result.id}`);
          return result;
        }

        const results = [];
        for (const pageId of pageIds) {
          const result = imagePath
            ? await facebookService.publishPhotoPost(message, imagePath, pageId)
            : await facebookService.publishTextPost(message, pageId);
          results.push({ pageId, result });
        }

        console.log(`Post published successfully for ${results.length} page(s)`);
        return { results };
      } catch (error) {
        console.error(`Failed to publish post: ${error.message}`);
        throw error;
      }
    });

    // Eventos da fila
    postQueue.on('completed', (job, result) => {
      console.log(`Job ${job.id} completed with result:`, result);
    });

    postQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });

    // Limpar jobs antigos diariamente
    cron.schedule('0 0 * * *', async () => {
      console.log('Cleaning up old jobs...');
      await postQueue.clean(7 * 24 * 60 * 60 * 1000); // 7 dias
    });

    console.log('✅ Queue system initialized');
  } catch (error) {
    console.error('Failed to setup queues:', error.message);
    console.warn('⚠️  Queue system disabled - posts will be published immediately');
  }
}

export function getPostQueue() {
  return postQueue;
}

export async function schedulePost(postData, scheduledTime) {
  if (!postQueue) {
    console.warn('⚠️  Queue system not available - scheduling may not work');
    throw new Error('Sistema de fila não inicializado. Verifique se o Redis está rodando.');
  }

  const delay = new Date(scheduledTime) - new Date();
  
  if (delay < 0) {
    throw new Error('Horário agendado deve ser no futuro');
  }

  console.log(`📅 Agendando post para ${new Date(scheduledTime).toLocaleString('pt-BR')} (delay: ${Math.round(delay/1000/60)} minutos)`);

  let job;
  try {
    console.log('🔄 Adicionando job à fila...');
    job = await postQueue.add(postData, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000 // 1 minuto
      }
    });

    console.log(`✅ Job ${job.id} criado com sucesso`);
  } catch (addError) {
    console.error('❌ Erro ao adicionar job à fila:', addError);
    throw addError;
  }

  return {
    jobId: job.id,
    scheduledTime,
    status: 'scheduled'
  };
}

export async function cancelScheduledPost(jobId) {
  if (!postQueue) {
    throw new Error('Queue system not initialized');
  }

  const job = await postQueue.getJob(jobId);
  
  if (!job) {
    throw new Error('Job not found');
  }

  await job.remove();
  return { success: true, message: 'Post cancelled' };
}

export async function getScheduledPosts() {
  if (!postQueue) {
    return [];
  }

  const jobs = await postQueue.getJobs(['delayed', 'waiting']);
  
  return jobs.map(job => ({
    id: job.id,
    data: job.data,
    scheduledTime: new Date(job.timestamp + job.opts.delay),
    status: job.getState()
  }));
}
