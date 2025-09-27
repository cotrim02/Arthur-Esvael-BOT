// youtubeLiveMonitor.js
const fetch = require('node-fetch');

async function checkYouTubeLive(channelId, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.items && data.items.length > 0) {
const liveTitle = data.items[0].snippet.title;
const liveUrl = `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;

    return { live: true, liveTitle, liveUrl };
  }
  return { live: false };
}

module.exports = { checkYouTubeLive };
