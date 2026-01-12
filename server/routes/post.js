import express from 'express';
import { schedulePost, cancelScheduledPost, getScheduledPosts } from '../services/queue.js';

const router = express.Router();

/**
 * POST /api/posts/schedule
 * Agenda um post para publicação futura
 */
router.post('/schedule', async (req, res, next) => {
  try {
    const { message, imagePath, scheduledTime, targetPageId, targetPageIds } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    if (!scheduledTime) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled time is required'
      });
    }
    
    const result = await schedulePost(
      { message, imagePath, targetPageId, targetPageIds },
      scheduledTime
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/posts/schedule/:jobId
 * Cancela um post agendado
 */
router.delete('/schedule/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const result = await cancelScheduledPost(jobId);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/posts/scheduled
 * Lista todos os posts agendados
 */
router.get('/scheduled', async (req, res, next) => {
  try {
    const posts = await getScheduledPosts();
    
    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    next(error);
  }
});

export default router;
