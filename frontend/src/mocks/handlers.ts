import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock for submitting an activity
  http.post('/api/activities', async () => {
    // Simulate a network delay
    await new Promise(res => setTimeout(res, 1000));

    // Simulate a successful response
    return HttpResponse.json(
      { success: true, message: 'Activity submitted successfully!' },
      { status: 201 }
    );
  }),
];
