import fetch from 'node-fetch';

// Pre-warm the connections with top-level await
await Promise.resolve();

const API_BASE_URL = process.env.API_BASE_URL;

// Random test data arrays
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Sage', 'River', 'Nova', 'Kai', 'Phoenix', 'Rowan', 'Sage', 'Emery'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

const techWords = [
  'code', 'dev', 'tech', 'digital', 'cyber', 'data', 'cloud', 'api',
  'stack', 'script', 'byte', 'pixel', 'logic', 'syntax', 'build'
];

const posts = [
  "Just shipped a new feature! 🚀 The performance improvements are incredible.",
  "Coffee + Code = Perfect morning ☕️ Working on something exciting today!",
  "Amazing conference keynote today. So many new ideas to explore! 💡",
  "Debugging is like being a detective in a crime movie where you're also the murderer. 🔍",
  "The best code is no code at all. Sometimes the solution is simpler than we think.",
  "Team collaboration makes everything better. Great brainstorming session today! 🧠",
  "Learning something new every day. Today it's about distributed systems architecture.",
  "Open source contribution feels so rewarding. Community-driven development is amazing! 🌟",
  "Refactoring legacy code... it's like archaeology but with more syntax errors. ⚗️",
  "Just deployed to production. Now comes the real test! 🎯",
  "User feedback is gold. Every comment helps us build better products. 💬",
  "Mentoring junior developers is one of the most fulfilling parts of this job. 👥",
  "The documentation was the real MVP today. Future me will thank past me! 📚",
  "Another day, another algorithm optimization. Performance gains are addictive! ⚡",
  "Remote work life: Pajama pants and productive code sessions. Living the dream! 🏠"
];

const bios = [
  "Passionate developer building the future one line at a time 🚀",
  "Coffee enthusiast and problem solver ☕",
  "Full-stack developer with a love for clean code",
  "Building beautiful user experiences with modern tech",
  "Code, design, and everything in between",
  "Developer by day, dreamer by night ✨",
  "Turning ideas into digital reality",
  "Open source contributor and lifelong learner",
  "Creating scalable solutions for complex problems",
  "Tech enthusiast sharing the journey"
];

// Helper functions
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateUsername = (firstName, lastName) => {
  const variants = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
    `${getRandomElement(techWords)}_${firstName.toLowerCase()}`,
    firstName.toLowerCase() + getRandomElement(techWords),
  ];
  return getRandomElement(variants);
};

// Helper function to make API calls
const makeApiCall = async (endpoint, method, body) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    const { userCount = '5', postsPerUser = '3' } = event.queryStringParameters || {};
    const numUsers = Math.min(parseInt(userCount), 20); // Limit to 20 users
    const numPostsPerUser = Math.min(parseInt(postsPerUser), 10); // Limit to 10 posts per user

    const createdUsers = [];
    let totalPostsCreated = 0;

    // Generate users and posts using API endpoints
    for (let i = 0; i < numUsers; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const displayName = `${firstName} ${lastName}`;
      const username = generateUsername(firstName, lastName);

      // Create user via API
      const userPayload = {
        username,
        displayName,
        email: `${username}@example.com`,
        bio: getRandomElement(bios),
        isPrivate: false,
        isVerified: Math.random() > 0.8, // 20% chance of being verified
      };

      const createdUser = await makeApiCall('/profiles', 'POST', userPayload);

      createdUsers.push({
        userId: createdUser.userId,
        username: createdUser.username,
        displayName: createdUser.displayName,
        postsCount: numPostsPerUser,
      });

      // Generate posts for this user via API
      for (let j = 0; j < numPostsPerUser; j++) {
        const postPayload = {
          content: getRandomElement(posts),
          imageUrl: '', // No images for now
        };

        // Note: We need to pass userId in the request somehow
        // This depends on how the create post endpoint is implemented
        await makeApiCall('/posts', 'POST', {
          ...postPayload,
          userId: createdUser.userId,
        });

        totalPostsCreated++;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Test data generated successfully',
        summary: {
          usersCreated: createdUsers.length,
          postsCreated: totalPostsCreated,
          totalItems: createdUsers.length + totalPostsCreated,
        },
        users: createdUsers,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Error generating test data:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate test data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};