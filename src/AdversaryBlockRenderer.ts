import {App, debounce, MarkdownRenderChild, MarkdownRenderer, parseLinktext, resolveSubpath, TFile} from "obsidian";

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
            let headerLevel: string = data["render-header-level"] || "h1"
            if (!headerLevel.toString().startsWith("h")) {
                headerLevel = "h" + headerLevel
            }

            root.createEl(headerLevel as keyof HTMLElementTagNameMap, {text: data.name, cls: "name"})
        }

        if (data.description) {
            const description = root.createEl("p", {cls: "description"});
            MarkdownRenderer.renderMarkdown(data.description, description, this.sourcePath, this).then(this.unwrapParagraph(description))
        }

        if (Array.isArray(data.distinctive_features)) {
            root.createEl("p", {text: data.distinctive_features.join(", "), cls: "distinctive-features"})
        } else if (data.distinctive_features) {
            root.createEl("p", {text: data.distinctive_features, cls: "distinctive-features"})
        }

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

    private renderCharacteristicsSection(root: HTMLElement, data: any) {
        const table = root.createEl("table", {cls: "characteristics"});
        const section = table.createEl("tbody")
        const headers = section.createEl("tr")
        const values = section.createEl("tr")


        headers.createEl("th", {text: "Endurance", cls: "endurance"})
        values.createEl("td", {text: data.endurance || "-", cls: "endurance"})
        headers.createEl("th", {text: "Might", cls: "might"})
        values.createEl("td", {text: data.might || "-", cls: "might"})

        if (data.resolve) {
            headers.createEl("th", {text: "Resolve", cls: "resolve"})
            values.createEl("td", {text: data.resolve, cls: "resolve"})
        } else {
            headers.createEl("th", {text: "Hate", cls: "hate"})
            values.createEl("td", {text: data.hate || "-", cls: "hate"})
        }

        headers.createEl("th", {text: "Parry", cls: "parry"})
        values.createEl("td", {text: data.parry || "-", cls: "parry"})
        headers.createEl("th", {text: "Armour", cls: "armour"})
        values.createEl("td", {text: data.armour || "-", cls: "armour"})
        headers.createEl("th", {text: "Attribute level", cls: "attribute-level"})
        values.createEl("td", {text: data.attribute_level || "-", cls: "attribute-level"})
    }

    private renderCombatProficienciesSection(root: HTMLElement, data: any) {
        if (Array.isArray(data.combat_proficiencies) && data.combat_proficiencies.length > 0) {
            const ul = root.createEl("p", {cls: "combat-proficiencies"})
            ul.createEl("strong", {text: "Combat proficiencies: ", cls: "caption"})
            data.combat_proficiencies.forEach((element: any, i: number) => {
                const li = ul.createSpan({cls: "combat-proficiency"})

                li.createSpan({text: element.name, cls: "name"})
                li.createSpan({text: " "})
                li.createSpan({text: element.rating, cls: "rating", title: "Rating: roll vs target's Parry"})
                li.createSpan({text: " ("})
                li.createSpan({text: element.damage, cls: "damage", title: "Damage: subtract from target's Endurance"})
                li.createSpan({text: "/"})
                li.createSpan({text: element.injury, cls: "injury", title: "Injury: target rolls Armour vs this"})

                if (element.special) {
                    li.createSpan({text: ", "})

                    if (Array.isArray(element.special)) {
                        for (let j = 0; j < element.special.length; j++) {
                            this.renderSpecialDamage(li, element.special[j])
                            if (j < element.special.length - 1) {
                                li.createSpan({text: ", "})
                            }
                        }
                    } else {
                        this.renderSpecialDamage(li, element.special)
                    }
                }

                li.createSpan({text: ")"})
                if (i < data.combat_proficiencies.length - 1) {
                    li.createSpan({text: ", "})
                }
            })
        }
    }

    private renderSpecialDamage(root: HTMLElement, text: string) {
        if (text == "Pierce") {
            root.createEl("a", {
                cls: "special-predefined",
                text: "Pierce",
                href: "#",
                title: "The attacker scores a well-aimed strike, modifying the Feat die result of the attack roll by +2."
            })
        } else if (text == "Seize") {
            root.createEl("a", {
                cls: "special-predefined",
                text: "Seize",
                href: "#",
                title: "The attacker holds on to the target — the victim can only fight in a Forward stance making Brawling attacks. Seized heroes may free themselves spending a icon from a successful attack roll."
            })
        } else if (text == "Break shield") {
            root.createEl("a", {
                cls: "special-predefined",
                text: "Break shield",
                href: "#",
                title: "The attack strikes repeatedly at the shield of the targeted Player-hero, smashing it to pieces. The target loses their shield’s bonus to Parry (a shield enhanced by Rewards or magical qualities cannot be smashed and thus is not affected)."
            })

        } else {
            const special = root.createSpan({cls: "special"})
            MarkdownRenderer.renderMarkdown(text, special, this.sourcePath, this).then(this.unwrapParagraph(special))
        }
    }

    private renderFellAbilitiesSection(root: HTMLElement, data: any) {
        if (Array.isArray(data.fell_abilities) && data.fell_abilities.length > 0) {

            data.fell_abilities.forEach((ability: any) => {
                    if (ability.name || ability.description || ability.embed) {
                        const p = root.createEl("p", {cls: "fell-ability"})

                        if (ability.name) {
                            p.createEl("strong", {text: ability.name + ": ", cls: "name"})
                        }

                        if (ability.description) {
                            p.createSpan({text: ability.description, cls: "description"})

                        } else if (ability.embed) {
                            this.embedContent(ability, p);
                        }
                    }
                }
            )
        }
    }

    private embedContent(ability: any, p: HTMLParagraphElement) {
        const linkText = parseLinktext(ability.embed.replace("[[", "").replace("]]", ""))
        const dest = this.app.metadataCache.getFirstLinkpathDest(linkText.path, this.sourcePath)

        if (dest) {
            const fileCache = this.app.metadataCache.getFileCache(dest);
            if (fileCache) {
                this.usedPaths.add(dest.path)
                const resolved = resolveSubpath(fileCache, linkText.subpath)
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
}
