import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TrendsService {
  async getTopClusters() {
    // Example: pull data from Reddit’s API
    const res = await axios.get(
      'https://www.reddit.com/r/all/top.json?limit=10',
    );
    return res.data.data.children.map((p: any) => ({
      title: p.data.title,
      score: p.data.score,
      subreddit: p.data.subreddit,
    }));
  }

  async getRisingTopics() {
    const res = await axios.get(
      'https://www.reddit.com/r/all/rising.json?limit=10',
    );
    return res.data.data.children.map((p: any) => ({
      title: p.data.title,
      score: p.data.score,
      subreddit: p.data.subreddit,
    }));
  }
}
