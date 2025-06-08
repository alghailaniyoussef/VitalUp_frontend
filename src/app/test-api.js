// This is a test script to check how the frontend is handling the quiz data
// Run this in the browser console when on the quiz page

async function testQuizAPI() {
  try {
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/quizzes`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', data);
      
      // Check available quizzes
      if (data.available_quizzes && data.available_quizzes.length > 0) {
        console.log('Available Quizzes Count:', data.available_quizzes.length);
        
        // Check the first quiz
        const firstQuiz = data.available_quizzes[0];
        console.log('First Quiz Title:', firstQuiz.title);
        console.log('First Quiz Questions Type:', typeof firstQuiz.questions);
        console.log('First Quiz Questions Length:', firstQuiz.questions?.length || 'N/A');
        console.log('First Quiz Questions:', firstQuiz.questions);
      }
    } else {
      console.error('Failed to fetch quizzes:', await response.text());
    }
  } catch (error) {
    console.error('Error testing quiz API:', error);
  }
}

// Call the function
testQuizAPI();