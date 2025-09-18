import { ProfileData, PostData, createSuccessResponse, createErrorResponse, createValidationError, handleOptionsRequest } from '../shared/index.mjs';
// import { sample, range, map, times } from 'lodash-es';

// Pre-warm the connections with top-level await
await Promise.resolve();

// Configuration constants
const LIMITS = {
  MAX_USERS: 20,
  MAX_POSTS_PER_USER: 10,
  MIN_VERIFIED_CHANCE: 0.8, // 20% chance of being verified
};

const DEFAULTS = {
  USER_COUNT: 5,
  POSTS_PER_USER: 3,
};

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

// Pure helper functions using functional programming
const generateUsername = (firstName, lastName) => {
  const variants = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
    `${techWords[Math.floor(Math.random() * techWords.length)]}_${firstName.toLowerCase()}`,
    firstName.toLowerCase() + techWords[Math.floor(Math.random() * techWords.length)],
  ];
  return variants[Math.floor(Math.random() * variants.length)];
};

const createUserPayload = (firstName, lastName) => {
  const displayName = `${firstName} ${lastName}`;
  const username = generateUsername(firstName, lastName);

  return {
    username,
    displayName,
    email: `${username}@example.com`,
    bio: bios[Math.floor(Math.random() * bios.length)],
    isPrivate: false,
    isVerified: Math.random() > LIMITS.MIN_VERIFIED_CHANCE,
  };
};

const createPostPayload = () => ({
  content: posts[Math.floor(Math.random() * posts.length)],
  imageUrl: '', // No images for now
});

// Functional data generation functions
const generateUserData = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return createUserPayload(firstName, lastName);
};

const validateParameters = (userCount, postsPerUser) => {
  const numUsers = Math.min(parseInt(userCount), LIMITS.MAX_USERS);
  const numPostsPerUser = Math.min(parseInt(postsPerUser), LIMITS.MAX_POSTS_PER_USER);

  if (isNaN(numUsers) || isNaN(numPostsPerUser) || numUsers < 1 || numPostsPerUser < 1) {
    throw new Error('Invalid userCount or postsPerUser parameters');
  }

  return { numUsers, numPostsPerUser };
};

// Database operation functions with proper error handling
const createUserWithPosts = async (numPostsPerUser) => {
  const userPayload = generateUserData();

  let createdUser;
  try {
    createdUser = await ProfileData.createProfile(userPayload);
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }

  const userSummary = {
    userId: createdUser.userId,
    username: createdUser.username,
    displayName: createdUser.displayName,
    postsCount: numPostsPerUser,
  };

  try {
    const postCreationPromises = Array.from({ length: numPostsPerUser }, () =>
      PostData.createPost(createdUser.userId, createPostPayload())
    );
    await Promise.all(postCreationPromises);
  } catch (error) {
    console.error(`Failed to create posts for user ${createdUser.userId}:`, error);
    // Continue with other users even if some posts fail
  }

  return { userSummary, postsCreated: numPostsPerUser };
};

const generateUsersWithPosts = async (numUsers, numPostsPerUser) => {
  const userCreationPromises = Array.from({ length: numUsers }, () => createUserWithPosts(numPostsPerUser));

  try {
    const results = await Promise.all(userCreationPromises);

    return {
      users: results.map(result => result.userSummary),
      totalPostsCreated: results.reduce((sum, result) => sum + result.postsCreated, 0),
    };
  } catch (error) {
    console.error('Failed to generate users and posts:', error);
    throw new Error(`Failed to generate test data: ${error.message}`);
  }
};

const createSuccessfulResponse = (users, totalPostsCreated) =>
  createSuccessResponse({
    message: 'Test data generated successfully',
    summary: {
      usersCreated: users.length,
      postsCreated: totalPostsCreated,
      totalItems: users.length + totalPostsCreated,
    },
    users,
    timestamp: new Date().toISOString(),
  });

// Main handler function - now much simpler and focused
export const handler = async (event) => {
  // Handle OPTIONS request
  const optionsResponse = handleOptionsRequest(event);
  if (optionsResponse) {
    return optionsResponse;
  }

  // Extract and validate parameters
  const { userCount = DEFAULTS.USER_COUNT.toString(), postsPerUser = DEFAULTS.POSTS_PER_USER.toString() } = event.queryStringParameters || {};

  let validatedParams;
  try {
    validatedParams = validateParameters(userCount, postsPerUser);
  } catch (error) {
    return createValidationError(error.message);
  }

  const { numUsers, numPostsPerUser } = validatedParams;

  // Generate test data
  try {
    const { users, totalPostsCreated } = await generateUsersWithPosts(numUsers, numPostsPerUser);
    return createSuccessfulResponse(users, totalPostsCreated);
  } catch (error) {
    console.error('Error generating test data:', error);
    return createErrorResponse('Failed to generate test data', error);
  }
};