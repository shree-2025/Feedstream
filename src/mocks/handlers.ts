import { http } from 'msw';

interface ActivityRequest {
  id?: string;
  activityType: string;
  title: string;
  description: string;
  date: string;
  status?: string;
  createdAt?: string;
  // Add other fields as needed
}

// Mock data
const activities: ActivityRequest[] = [];

export const handlers = [
  // Mock for submitting an activity
  http.post('/api/activities', async (req, res, ctx) => {
    try {
      // Simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the request body
      const body = await req.json() as ActivityRequest;
      
      // Add the new activity to our mock data
      const newActivity = {
        ...body,
        id: Math.random().toString(36).substring(2, 9),
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      activities.push(newActivity);

      // Return the created activity
      return res(
        ctx.status(201),
        ctx.json({
          success: true,
          message: 'Activity submitted successfully!',
          data: newActivity
        })
      );
    } catch (error) {
      return res(
        ctx.status(400),
        ctx.json({
          success: false,
          message: 'Invalid request body',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      );
    }
  }),
  
  // Get all activities
  http.get('/api/activities', (_, res, ctx) => {
    return res(
      ctx.json({
        data: activities,
        total: activities.length,
        page: 1,
        limit: 10
      })
    );
  }),
  
  // Get a single activity by ID
  http.get('/api/activities/:id', (req, res, ctx) => {
    const { id } = req.params;
    const activity = activities.find(a => a.id === id);
    
    if (!activity) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: 'Activity not found'
        })
      );
    }
    
    return res(
      ctx.json({
        success: true,
        data: activity
      })
    );
  })
];
