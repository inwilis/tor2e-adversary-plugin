import {MarkdownPostProcessorContext, parseLinktext, parseYaml, Plugin} from 'obsidian';
import {CODE_BLOCK_ADVERSARY, CSS_CLASS_ERROR} from "./constants";
import {AdversaryBlockRenderer} from "./AdversaryBlockRenderer";

export default class Tor2ePlugin extends Plugin {

    async onload() {
        this.registerMarkdownCodeBlockProcessor(CODE_BLOCK_ADVERSARY, this.processAdversaryCodeBlock.bind(this))
    }

    onunload() {

    }

    async processAdversaryCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
        const params = {...parseYaml(source)}


        const data = this.getCodeblockData(params, ctx)

        try {
            if (!params.render || params.render == "block") {
                ctx.addChild(new AdversaryBlockRenderer(this.app, el, data, ctx.sourcePath))
            }

        } catch (e) {
            el.createSpan({text: e, cls: CSS_CLASS_ERROR})
        }
    }

    private getCodeblockData(params: any, ctx: MarkdownPostProcessorContext) {
        if (params.data == "frontmatter") {
            return {...app.metadataCache.getCache(ctx.sourcePath)?.frontmatter, ...params}

        } else if (params.data) {
            const linkText = parseLinktext(params.data.replace("[[", "").replace("]]", ""))
            const dest = this.app.metadataCache.getFirstLinkpathDest(linkText.path, ctx.sourcePath)

            if (dest) {
                return {...app.metadataCache.getFileCache(dest)?.frontmatter, ...params}
            }
        }

        return params
    }
}
