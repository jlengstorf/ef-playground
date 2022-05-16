import { Context } from 'netlify:edge';
import {
  HTMLRewriter,
  Element,
} from 'https://ghuc.cc/worker-tools/html-rewriter/index.ts';

const formatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const apiUrl = new URL(
  Deno.env.get('URL') || 'https://ef-playground.netlify.app/',
);

async function getStats(endpoint: string, fallback: object) {
  apiUrl.pathname = endpoint;

  return fetch(apiUrl.toString())
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
      }

      return res;
    })
    .then((res) => res.json())
    .catch(() => fallback);
}

async function getYouTubeSubscribers() {
  return getStats('/api/stats/youtube', { subscribers: 0 });
}

async function getTwitchFollowers() {
  return getStats('/api/stats/twitch', { followers: 0 });
}

async function getTwitterFollowers() {
  return getStats('/api/stats/twitter', { followers: 0 });
}

async function getPostCount() {
  return getStats('/api/stats/blog', { posts: 0 });
}

async function getEpisodeCount() {
  return getStats('/api/stats/lwj', { episodes: 0 });
}

export default async function (_request: Request, context: Context) {
  const youtube = getYouTubeSubscribers();
  const twitch = getTwitchFollowers();
  const twitter = getTwitterFollowers();
  const blog = getPostCount();
  const lwj = getEpisodeCount();

  const { subscribers } = await youtube;
  const { followers } = await twitch;
  const { followers: twitterFollowers } = await twitter;
  const { posts } = await blog;
  const { episodes } = await lwj;

  const response = await context.next();

  return new HTMLRewriter()
    .on('[data-site="youtube"]', {
      element(element: Element) {
        if (subscribers > 0) {
          element.append(
            `<span class="count">${formatter.format(
              subscribers,
            )} subscribers</span>`,
            {
              html: true,
            },
          );
        }
      },
    })
    .on('[data-site="twitch"]', {
      element(element: Element) {
        if (followers > 0) {
          element.append(
            `<span class="count">${formatter.format(
              followers,
            )} followers</span>`,
            {
              html: true,
            },
          );
        }
      },
    })
    .on('[data-site="twitter"]', {
      element(element: Element) {
        if (twitterFollowers > 0) {
          element.append(
            `<span class="count">${formatter.format(
              twitterFollowers,
            )} followers</span>`,
            {
              html: true,
            },
          );
        }
      },
    })
    .on('[data-site="blog"]', {
      element(element: Element) {
        if (posts > 0) {
          element.append(
            `<span class="count">${formatter.format(posts)} posts</span>`,
            {
              html: true,
            },
          );
        }
      },
    })
    .on('[data-site="lwj"]', {
      element(element: Element) {
        if (episodes > 0) {
          element.append(
            `<span class="count">${formatter.format(episodes)} episodes</span>`,
            {
              html: true,
            },
          );
        }
      },
    })
    .transform(response);
}
