import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const SPEC_FILES: string[] = [
    'policy.accept.xml',
    'policy.view.xml',
    'session.login_np.xml',
    'session.ping.xml',
    'session.set_presence.xml',
    'session.set_presence_get.xml',
    'player_glicko.bulk_fetch.xml',
    'buddy.replicate.xml',
    'content_url.list.xml',
    'tag.list.xml',
    'profanity_filter.list.xml',
    'server.select.xml',
    'achievement.list.xml',
    'favorite_player.list.xml',
    'player.to_id.xml',
    'player.info.xml',
    'player_avatar.update.xml',
    'privacy_setting.show.xml',
    'news_feed.tally.xml',
    'player_creation_bookmark.tally.xml',
    'player_creation_bookmark.create.xml',
    'player_creation_bookmark.remove.xml',
    'player_creation.verify.xml',
    'player_creation_rating.view.xml',
    'player_creation_review.list.xml',
    'player_creation_comment.create.xml',
    'player_creation_comment.list.xml',
    'favorite_player_creation.create.xml',
    'favorite_player_creation.destroy.xml',
    'favorite_player_creation.list.xml',
    'track.list.xml',
    'track.create.xml',
    'track.download.xml',
    'track.friends_published.xml',
    'track.profile.xml',
    'event.create.xml',
    'planet.profile.xml',
    'planet.show.xml',
    'photo.search.xml',
    'sub_leaderboard.around_me.xml',
    'sub_leaderboard.friends_view.xml',
    'sub_leaderboard.view.xml',
    'single_player_game.create_finish_and_post_stats.xml',
    'player_profile.view.xml',
    'skill_level.list.xml',
    'player_creation.mine.xml',
    'player_metric.show.xml',
    'player_metric.update.xml',
    'player_creation.list.xml',
    'player_creation.search.xml',
    'player_creation.show.xml',
    'player_creation.create.xml',
    'player_creation.destroy.xml',
    'player_creation.download.xml',
    'player_creation.friends_view.xml',
    'player_profile.update.xml',
    'player_spotlight.list.xml',
    'player.skill_levels.xml',
    'player_complaint.create.xml',
    'player_creation_complaint.create.xml',
    'player_creation_rating.create.xml',
    'announcement.list.xml',
    'content_update.latest.xml',
    'leaderboard.view.xml',
    'leaderboard.friends_view.xml',
    'leaderboard.player_stats.xml',
    'mail_message.create.xml',
    'mail_message.destroy.xml',
    'mail_message.list.xml',
    'mail_message.show.xml',
    'favorite_player.create.xml',
    'favorite_player.remove.xml',
];

SPEC_FILES.forEach(file => {
    const filePath = path.join(process.cwd(), 'src', 'templates', file);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`[specs] MISSING template: ${file}`);
        return;
    }
    
    router.get(`/${file}`, (req: Request, res: Response) => {
        console.log(`[specs] serving: ${file}`);
        res.set('Content-Type', 'text/xml');
        res.sendFile(filePath);
    });
});

export default router;