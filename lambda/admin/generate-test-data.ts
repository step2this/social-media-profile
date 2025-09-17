import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME!;

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

const adjectives = [
  'creative', 'innovative', 'passionate', 'curious', 'ambitious', 'focused',
  'dynamic', 'strategic', 'analytical', 'versatile', 'dedicated', 'inspiring'
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
  "Building the future, one line of code at a time 💻",
  "Full-stack developer with a passion for clean code",
  "Coffee enthusiast and problem solver ☕",
  "Creating digital experiences that matter",
  "Code, design, and everything in between",
  "Turning ideas into reality through technology",
  "Always learning, always building 🚀",
  "Making the web a better place, one commit at a time",
  "Developer by day, dreamer by night ✨",
  "Passionate about user experience and performance"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUsername(firstName: string, lastName: string): string {
  const patterns = [
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 999)}`,
    `${getRandomElement(techWords)}_${firstName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${getRandomElement(techWords)}`
  ];
  return getRandomElement(patterns);
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

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

    const createdUsers: any[] = [];
    const createdPosts: any[] = [];

    // Generate users
    for (let i = 0; i < numUsers; i++) {
      const userId = randomUUID();
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const username = generateUsername(firstName, lastName);
      const displayName = `${firstName} ${lastName}`;
      const timestamp = new Date().toISOString();

      const user = {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        userId,
        username,
        displayName,
        email: `${username}@example.com`,
        bio: getRandomElement(bios),
        avatar: '',
        isPrivate: false,
        isVerified: Math.random() > 0.8, // 20% chance of being verified
        followersCount: Math.floor(Math.random() * 1000),
        followingCount: Math.floor(Math.random() * 500),
        postsCount: numPostsPerUser,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: user
      }));

      createdUsers.push(user);

      // Generate posts for this user
      for (let j = 0; j < numPostsPerUser; j++) {
        const postId = randomUUID();
        const postTimestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(); // Random time in last 7 days

        const post = {
          PK: `POST#${postId}`,
          SK: 'METADATA',
          postId,
          userId,
          username,
          displayName,
          avatar: user.avatar,
          content: getRandomElement(posts),
          imageUrl: '',
          likesCount: Math.floor(Math.random() * 100),
          commentsCount: Math.floor(Math.random() * 20),
          createdAt: postTimestamp,
          updatedAt: postTimestamp,
          version: 1,
        };

        await docClient.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: post
        }));

        createdPosts.push(post);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Test data generated successfully',
        summary: {
          usersCreated: createdUsers.length,
          postsCreated: createdPosts.length,
          totalItems: createdUsers.length + createdPosts.length,
        },
        users: createdUsers.map(u => ({
          userId: u.userId,
          username: u.username,
          displayName: u.displayName,
          postsCount: numPostsPerUser,
        })),
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error generating test data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};