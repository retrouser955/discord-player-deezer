import { BaseExtractor, ExtractorInfo, ExtractorSearchContext, Playlist, SearchQueryType, Track, Util } from "discord-player"
import { getData } from "@mithron/deezer-music-metadata"
import { YouTube } from "youtube-sr";
import { Readable } from "stream";
import { StreamFN, loadYtdl } from "@discord-player/extractor"

interface DeezerRegex {
    track: RegExp; 
    playlistNalbums: RegExp; 
    share: RegExp
}

export default class DeezerExtractor extends BaseExtractor {
    public static identifier: string = "com.discord-player.deezerextractor" as const
    private _stream!: StreamFN

    private deezerRegex: DeezerRegex = {
        track: /(^https:)\/\/(www\.)?deezer.com\/([a-zA-Z]+\/)?track\/[0-9]+/,
        playlistNalbums: /(^https:)\/\/(www\.)?deezer.com\/[a-zA-Z]+\/(playlist|album)\/[0-9]+(\?)?(.*)/,
        share: /(^https:)\/\/deezer\.page\.link\/[A-Za-z0-9]+/
    };

    public async activate(): Promise<void> {
        const { stream: ytdlStream } = await loadYtdl()

        this._stream = ytdlStream
    }

    public async validate(query: string, _type?: SearchQueryType | null | undefined): Promise<boolean> {
        if (typeof query !== "string") return false

        return this.deezerRegex.track.test(query) || this.deezerRegex.playlistNalbums.test(query) || this.deezerRegex.share.test(query)
    }

    public async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
        const data = await getData(query)

        if (data?.type === "song") {
            const returnData = {
                playlist: null,
                tracks: [
                    new Track(this.context.player, {
                        title: data?.name as string,
                        raw: data,
                        description: "",
                        author: data.author.map((artist) => artist.name).join(" "),
                        url: data.url,
                        source: "arbitrary",
                        thumbnail: data.thumbnail[0].url,
                        duration: Util.buildTimeCode(Util.parseMS(data.duration * 1000)),
                        views: 0,
                        requestedBy: context.requestedBy
                    })
                ]
            }

            return returnData
        }

        if (data?.type === "playlist" || data?.type === "album") {
            const raw: string[] = data.url.split("/")
            const identifier: string = raw[raw.length - 1]

            const playlist = new Playlist(this.context.player, {
                title: data.name,
                thumbnail: data.thumbnail[0].url,
                author: {
                    name: data.artist.name,
                    url: data.artist.url
                },
                type: data.type,
                rawPlaylist: data,
                tracks: [],
                description: "",
                source: "arbitrary",
                id: identifier,
                url: data.url
            })

            const tracks = data.tracks.map(track => {
                return new Track(this.context.player, {
                    title: track.name as string,
                    raw: track,
                    description: "",
                    author: track.author.map((artist) => artist.name).join(" "),
                    url: track.url,
                    source: "arbitrary",
                    thumbnail: track.thumbnail[0].url,
                    duration: Util.buildTimeCode(Util.parseMS(track.duration * 1000)),
                    views: 0,
                    requestedBy: context.requestedBy
                })
            })

            playlist.tracks = tracks

            return {
                playlist,
                tracks
            }
        }

        return { playlist: null, tracks: [] }
    }

    public async stream(info: Track): Promise<string | Readable> {

        try {
            const searchQuery: string = `${info.author} - ${info.title} audio`

            const serachResults = await YouTube.search(searchQuery, {
                limit: 1,
                type: "video"
            })

            const stream = await this._stream(serachResults[0].url)

            return stream
        } catch (error) {
            throw(error)
        }
    }
}