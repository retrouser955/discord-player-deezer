/// <reference types="node" />
import { BaseExtractor, ExtractorInfo, ExtractorSearchContext, SearchQueryType, Track } from "discord-player";
import { Readable } from "stream";
export default class DeezerExtractor extends BaseExtractor {
    static identifier: string;
    private _stream;
    private deezerRegex;
    activate(): Promise<void>;
    validate(query: string, _type?: SearchQueryType | null | undefined): Promise<boolean>;
    handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo>;
    stream(info: Track): Promise<string | Readable>;
}
