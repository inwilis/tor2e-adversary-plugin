import {MarkdownPostProcessorContext, parseYaml, Plugin} from 'obsidian';
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

        try {
            if (params.render?.type || "block"  == "block") {
                ctx.addChild(new AdversaryBlockRenderer(this.app, el, ctx.sourcePath, params))
            }

        } catch (e) {
            el.createSpan({text: e, cls: CSS_CLASS_ERROR})
        }
    }


}
