// THIS IS A COMPILED FILE! DO NOT MAKE ANY CHANGES TO THIS
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const discord_player_1 = require('discord-player');
const deezer_music_metadata_1 = require('@mithron/deezer-music-metadata');
const youtube_sr_1 = require('youtube-sr');
const extractor_1 = require('@discord-player/extractor');
class DeezerExtractor extends discord_player_1.BaseExtractor {
  constructor() {
    super(...arguments);
    this.deezerRegex = {
      track: /(^https:)\/\/(www\.)?deezer.com\/([a-zA-Z]+\/)?track\/[0-9]+/,
      playlistNalbums: /(^https:)\/\/(www\.)?deezer.com\/[a-zA-Z]+\/(playlist|album)\/[0-9]+(\?)?(.*)/,
      share: /(^https:)\/\/deezer\.page\.link\/[A-Za-z0-9]+/,
    };
  }
  async activate() {
    this.deezerRegex.track = /(^https:)\/\/(www\.)?deezer.com\/([a-zA-Z]+\/)?track\/[0-9]+/;
    this.deezerRegex.playlistNalbums = /(^https:)\/\/(www\.)?deezer.com\/[a-zA-Z]+\/(playlist|album)\/[0-9]+(\?)?(.*)/;
    this.deezerRegex.share = /(^https:)\/\/deezer\.page\.link\/[A-Za-z0-9]+/;
    const { stream: ytdlStream } = await (0, extractor_1.loadYtdl)();
    this._stream = ytdlStream;
  }
  async validate(query, _type) {
    if (typeof query !== 'string') return false;
    return this.deezerRegex.track.test(query) || this.deezerRegex.playlistNalbums.test(query);
  }
  async handle(query, _context) {
    const data = await (0, deezer_music_metadata_1.getData)(query);
    if (data?.type === 'song') {
      const returnData = {
        playlist: null,
        tracks: [
          new discord_player_1.Track(this.context.player, {
            title: data?.name,
            raw: data,
            description: '',
            author: data.author.map((artist) => artist.name).join(' '),
            url: data.url,
            source: 'arbitrary',
            thumbnail: data.thumbnail[0].url,
            duration: discord_player_1.Util.buildTimeCode(discord_player_1.Util.parseMS(data.duration * 1000)),
            views: 0,
          }),
        ],
      };
      return returnData;
    }
    if (data?.type === 'playlist' || data?.type === 'album') {
      const raw = data.url.split('/');
      const identifier = raw[raw.length - 1];
      const playlist = new discord_player_1.Playlist(this.context.player, {
        title: data.name,
        thumbnail: data.thumbnail[0].url,
        author: {
          name: data.artist.name,
          url: data.artist.url,
        },
        type: data.type,
        rawPlaylist: data,
        tracks: [],
        description: '',
        source: 'arbitrary',
        id: identifier,
        url: data.url,
      });
      const tracks = data.tracks.map((track) => {
        return new discord_player_1.Track(this.context.player, {
          title: track.name,
          raw: track,
          description: '',
          author: track.author.map((artist) => artist.name).join(' '),
          url: track.url,
          source: 'arbitrary',
          thumbnail: track.thumbnail[0].url,
          duration: discord_player_1.Util.buildTimeCode(discord_player_1.Util.parseMS(track.duration * 1000)),
          views: 0,
        });
      });
      playlist.tracks = tracks;
      return {
        playlist,
        tracks,
      };
    }
    return { playlist: null, tracks: [] };
  }
  async stream(info) {
    try {
      const searchQuery = `${info.author} - ${info.title} audio`;
      const serachResults = await youtube_sr_1.YouTube.search(searchQuery, {
        limit: 1,
        type: 'video',
      });
      const stream = await this._stream(serachResults[0].url);
      return stream;
    } catch (error) {
      throw error;
    }
  }
}
exports.default = DeezerExtractor;
DeezerExtractor.identifier = 'com.discord-player.deezerextractor';
