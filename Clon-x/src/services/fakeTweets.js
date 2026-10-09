import sampleData from "../data/tweets.json";

const PAGE_SIZE = 10;
const USERS_CACHE_KEY = "clonx:fake-users:v1";
const TWEET_CACHE_PREFIX = "clonx:fake-tweets:v1:";

export const fakeUsers = sampleData.users;
export const fakeTweetSources = sampleData.tweets;

function seededValue(seed) {
  let value = seed >>> 0;
  value = (value * 1664525 + 1013904223) >>> 0;
  return value / 4294967296;
}

function cacheGet(key) {
  try {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function cacheSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The local sample feed still works if browser storage is unavailable.
  }
}

export function getFakeTweetPage(page) {
  const cacheKey = `${TWEET_CACHE_PREFIX}${page}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return Promise.resolve(
      cached.map((tweet) => ({
        ...tweet,
        createdAt: new Date(tweet.createdAt),
      })),
    );
  }

  const cachedUsers = cacheGet(USERS_CACHE_KEY);
  const users = cachedUsers || sampleData.users;
  if (!cachedUsers) cacheSet(USERS_CACHE_KEY, users);

  const start = page * PAGE_SIZE;
  const posts = sampleData.tweets.slice(start, start + PAGE_SIZE);
  const now = Date.now();
  const pageTweets = posts.map((post) => {
    const author = users.find((candidate) => candidate.id === post.userId);
    const seed = post.id * 7919 + post.userId * 104729;
    const tags = [...new Set(post.body.match(/#[\p{L}\p{N}_]+/gu) || [])];
    const missingTags = tags.filter(
      (tag) => !post.body.toLocaleLowerCase().includes(tag.toLocaleLowerCase()),
    );

    return {
      id: `fake-${post.id}`,
      uid: `fake-user-${post.userId}`,
      text: `${post.body}${missingTags.length ? ` ${missingTags.join(" ")}` : ""}`,
      username: author?.username || "cuenta_ejemplo",
      displayName: author?.displayName || "Cuenta de ejemplo",
      photoURL: author?.photoURL || "",
      likes: [],
      fakeLikeCount: Math.floor(seededValue(seed) * 250),
      views: Math.floor(seededValue(seed + 1) * 18000),
      replyCount: Math.floor(seededValue(seed + 2) * 41),
      retweetCount: Math.floor(seededValue(seed + 3) * 101),
      createdAt: new Date(now - seededValue(seed + 4) * 7 * 24 * 60 * 60 * 1000),
      replyTo: null,
      tags,
    };
  });

  cacheSet(
    cacheKey,
    pageTweets.map((tweet) => ({
      ...tweet,
      createdAt: tweet.createdAt.toISOString(),
    })),
  );
  return Promise.resolve(pageTweets);
}

export function hasMoreFakeTweets(page) {
  return page * PAGE_SIZE < sampleData.tweets.length;
}

export async function getAllFakeTweets() {
  const pageCount = Math.ceil(sampleData.tweets.length / PAGE_SIZE);
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, page) => getFakeTweetPage(page)),
  );
  return pages.flat();
}
