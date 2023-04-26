import {App, debounce, MarkdownRenderChild, MarkdownRenderer, parseLinktext, resolveSubpath, TFile} from "obsidian";
import tippy from "tippy.js";

export class AdversaryBlockRenderer extends MarkdownRenderChild {

    private readonly usedPaths: Set<string> = new Set<string>()

    constructor(readonly app: App, containerEl: HTMLElement, private sourcePath: string, readonly params: any) {
        super(containerEl)
    }

    onload() {
        this.render()

        if (this.usedPaths.size > 0) {
            this.registerEvent(this.app.metadataCache.on("changed", debounce((file: TFile) => {
                this.renderIfDependencyChanged(file.path);
            }).bind(this)))

            this.registerEvent(this.app.vault.on("rename", debounce((file: TFile, oldPath: string) => {
                this.sourcePath = file.path
                this.renderIfDependencyChanged(oldPath)
            }).bind(this)))
        }
    }


    renderIfDependencyChanged(changedPath: string) {
        if (this.usedPaths.has(changedPath)) {
            this.render()
        }
    }

    render() {
        this.usedPaths.clear()
        const data = this.getCodeblockData()
        this.containerEl.querySelector(".tor2e-adversary")?.remove()
        const root = this.containerEl.createDiv({cls: "tor2e-adversary"})

        if (data.name) {
            let headerLevel: string = data.render?.header || "h1"
            if (!headerLevel.toString().startsWith("h")) {
                headerLevel = "h" + headerLevel
            }

            root.createEl(headerLevel as keyof HTMLElementTagNameMap, {text: data.name, cls: "name"})
        }

        if (data.description) {
            const description = root.createEl("span", {cls: "description"});
            MarkdownRenderer.renderMarkdown(data.description, description, this.sourcePath, this).then(this.unwrapParagraph(description))
        }

        this.renderDistinctiveFeatures(root, data)
        this.renderCharacteristicsSection(root, data)
        this.renderCombatProficienciesSection(root, data)
        this.renderFellAbilitiesSection(root, data)
    }

    private getCodeblockData() {
        if (this.params.data == "frontmatter") {
            this.usedPaths.add(this.sourcePath)
            return {...app.metadataCache.getCache(this.sourcePath)?.frontmatter, ...this.params}

        } else if (this.params.data) {
            const linkText = parseLinktext(this.params.data.replace("[[", "").replace("]]", ""))
            const dest = this.app.metadataCache.getFirstLinkpathDest(linkText.path, this.sourcePath)

            if (dest) {
                this.usedPaths.add(dest.path)
                return {...app.metadataCache.getFileCache(dest)?.frontmatter, ...this.params}
            }
        }

        return this.params
    }

    private renderDistinctiveFeatures(root: HTMLDivElement, data: any) {
        const features = data.distinctive_features || data.traits

        if (Array.isArray(features)) {
            root.createEl("span", {text: features.join(", "), cls: "distinctive-features"})
        } else if (features) {
            root.createEl("span", {text: features, cls: "distinctive-features"})
        }
    }

    private renderCharacteristicsSection(root: HTMLElement, data: any) {
        const table = root.createEl("table", {cls: "characteristics"});
        const section = table.createEl("tbody")
        const headers = section.createEl("tr")
        const values = section.createEl("tr")

        this.renderCharacteristic(headers, values, "Endurance", data.endurance)
        this.renderCharacteristic(headers, values, "Might", data.might)

        if (data.resolve) {
            this.renderCharacteristic(headers, values, "Resolve", data.resolve)
        } else {
            this.renderCharacteristic(headers, values, "Hate", data.hate)
        }

        this.renderCharacteristic(headers, values, "Parry", data.parry)
        this.renderCharacteristic(headers, values, "Armour", data.armour)
        this.renderCharacteristic(headers, values, "Attribute level", data.attribute_level)
    }

    private renderCharacteristic(headers: HTMLElement, values: HTMLElement, name: string, value: any) {
        const cls = name.toLowerCase().replace(" ", "-")
        headers.createEl("th", {text: name, cls: cls})
        values.createEl("td", {text: value || "-", cls: cls})
    }

    private renderCombatProficienciesSection(root: HTMLElement, data: any) {
        if (Array.isArray(data.combat_proficiencies) && data.combat_proficiencies.length > 0) {
            const proficiencies = root.createEl("span", {cls: "combat-proficiencies"})
            proficiencies.createEl("strong", {text: "Combat proficiencies: ", cls: "caption"})
            data.combat_proficiencies.forEach((element: any, i: number) => {
                const proficiency = proficiencies.createSpan({cls: "combat-proficiency"})

                proficiency.createSpan({text: element.name, cls: "name"})
                proficiency.createSpan({text: " "})
                this.tooltip(proficiency.createSpan({
                    text: element.rating,
                    cls: "rating"
                }), "<span><strong>Rating:</strong> roll vs target's <strong>Parry</strong></span>")
                proficiency.createSpan({text: " ("})
                this.tooltip(proficiency.createSpan({
                    text: element.damage,
                    cls: "damage"
                }), "<span><strong>Damage:</strong> subtract from target's <strong>Endurance</strong></span>")

                proficiency.createSpan({text: "/"})
                this.tooltip(proficiency.createSpan({
                    text: element.injury,
                    cls: "injury"
                }), "<span><strong>Injury:</strong> target rolls <strong>Armour</strong> vs this</span>")

                if (element.special) {
                    proficiency.createSpan({text: ", "})

                    if (Array.isArray(element.special)) {
                        for (let j = 0; j < element.special.length; j++) {
                            this.renderSpecialDamage(proficiency, element.special[j])
                            if (j < element.special.length - 1) {
                                proficiency.createSpan({text: ", "})
                            }
                        }
                    } else {
                        this.renderSpecialDamage(proficiency, element.special)
                    }
                }

                proficiency.createSpan({text: ")"})
                if (i < data.combat_proficiencies.length - 1) {
                    proficiency.createSpan({text: ", "})
                }
            })
        }
    }

    private renderSpecialDamage(root: HTMLElement, text: string) {
        if (text == "Pierce") {
            this.tooltip(root.createEl("span", {cls: "special-predefined", text: "Pierce"}),
                "<span>The attacker scores a well-aimed strike, modifying the Feat die result of the attack roll by <strong>+2</strong>.</span>")
        } else if (text == "Seize") {
            this.tooltip(root.createEl("span", {cls: "special-predefined", text: "Seize"}),
                "<span>The attacker holds on to the target — the victim can only fight in a <strong>Forward</strong> stance making <strong>Brawling</strong> attacks. Seized heroes may free themselves by spending <strong>additional success</strong> from attack roll.</span>")
        } else if (text == "Break shield") {
            this.tooltip(root.createEl("span", {cls: "special-predefined", text: "Break shield"}),
                "<span>The attack strikes repeatedly at the shield of the targeted Player-hero, smashing it to pieces. The target loses their shield’s <strong>bonus to Parry</strong> (a shield enhanced by Rewards or magical qualities cannot be smashed and thus is not affected).</span>")

        } else {
            const special = root.createSpan({cls: "special"})
            MarkdownRenderer.renderMarkdown(text, special, this.sourcePath, this).then(this.unwrapParagraph(special))
        }
    }

    private renderFellAbilitiesSection(root: HTMLElement, data: any) {
        if (Array.isArray(data.fell_abilities) && data.fell_abilities.length > 0) {

            data.fell_abilities.forEach((ability: any) => {
                    if ((ability.name && ability.description) || ability.embed) {
                        const p = root.createEl("span", {cls: "fell-ability"})

                        if (ability.name && ability.description) {
                            p.createEl("strong", {text: ability.name + ": ", cls: "name"})
                            p.createSpan({text: ability.description, cls: "description"})

                        } else if (ability.embed) {
                            this.embedContent(ability.name, ability, p);
                        }
                    }
                }
            )
        }
    }

    private embedContent(name: string | undefined, ability: any, p: HTMLElement) {
        const linkText = parseLinktext(ability.embed.replace("[[", "").replace("]]", ""))
        const dest = this.app.metadataCache.getFirstLinkpathDest(linkText.path, this.sourcePath)

        if (dest) {
            const fileCache = this.app.metadataCache.getFileCache(dest);
            if (fileCache) {
                this.usedPaths.add(dest.path)
                const resolved = resolveSubpath(fileCache, linkText.subpath)

                p.createEl("strong", {text: (name || linkText.subpath.replace("#", "")) + ": ", cls: "name"})
                const embed = p.createSpan({cls: "embed"})

                dest.vault.cachedRead(dest).then(content => {
                    return content.substring(resolved.start.offset, resolved.end?.offset)
                        .split(/\n|\r\n/)
                        .filter(line => !line.includes(linkText.subpath.replace("#", "")))
                        .join("\n")

                }).then(contentToRender => {
                    return MarkdownRenderer.renderMarkdown(contentToRender, embed, this.sourcePath, this)
                }).then(this.unwrapParagraph(embed))

            }
        }
    }

    private unwrapParagraph(root: HTMLElement) {
        return () => {
            let paragraph = root.querySelector("p");
            while (paragraph) {
                const children = paragraph.childNodes;
                paragraph.replaceWith(...Array.from(children));
                paragraph = root.querySelector("p");
            }
        }
    }

    private tooltip(e: HTMLElement, text: string): HTMLElement {
        tippy(e, {
            content: text,
            theme: "tor2e-adversary",
            allowHTML: true,
            // hideOnClick: false,
            // trigger: 'click'
        })
        e.addClass("with-tooltip")
        return e
    }
}
