import { Injectable } from '@nestjs/common';
import vader from 'vader-sentiment';

// Keyword sets to enrich emotion mapping
const FEAR  = ['fear','panic','threat','crisis','terror','warns','alarm','collapse','shock'];
const ANGER = ['anger','furious','outrage','slam','blast','rage','backlash'];
const JOY   = ['joy','win','soars','surges','celebrate','delight','record'];
const HOPE  = ['hope','progress','recovery','resolve','promise','path forward'];

const hasAny = (text: string, list: string[]) => {
  const lower = text.toLowerCase();
  return list.some(word => lower.includes(word));
};

@Injectable()
export class EmotionService {
  scoreHeadline(title: string) {
    const clean = title.trim();
    const { compound, pos, neu, neg } =
      vader.SentimentIntensityAnalyzer.polarity_scores(clean);

    let fear = Math.max(0, neg);
    let anger = 0;
    let joy = Math.max(0, pos * 0.7);
    let hope = Math.max(0, pos * 0.3);
    let neutral = Math.max(0, neu);

    // boost intensity
    if (compound <= -0.6) { fear += 0.15; anger += 0.10; }
    if (compound >=  0.6) { joy  += 0.15; hope  += 0.10; }

    if (hasAny(clean, FEAR))  fear  += 0.20;
    if (hasAny(clean, ANGER)) anger += 0.20;
    if (hasAny(clean, JOY))   joy   += 0.20;
    if (hasAny(clean, HOPE))  hope  += 0.20;

    let sum = fear + anger + joy + hope + neutral;
    if (sum <= 1e-9) { neutral = 1; sum = 1; }

    return {
      fear: fear / sum,
      anger: anger / sum,
      joy: joy / sum,
      hope: hope / sum,
      neutral: neutral / sum,
      raw: { compound, pos, neu, neg }
    };
  }
}