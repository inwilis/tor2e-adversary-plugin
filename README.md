# Adversary codeblock for TOR2e

This plugin renders adversary statistics for **The One Ring 2e** pen-and-paper RPG.

## General concepts

Adversary statistics are displayed with the code block of the following structure:

````
```tor2e-adversary
name: Some name
distinctive_features: 
  - Feature A
  - Feature B
attribute_level: 3
endurance: 12
might: 1
hate: 2
parry: "+3"
armour: 4d
combat_proficiencies:
  - name: First
    rating: 1 
    damage: 2
    injury: 11
    special: Pierce
  - name: Second
    rating: 2 
    damage: 3
    injury: 13
    special: 
      - Pierce
      - Seize
      - Break shield
  - name: Third
    rating: 4 
    damage: 4
    injury: 17
    special: "[[Home rules#^something|Something]]"
fell_abilities: 
  - name: Ability A
    description: does something 
  - name: Ability B
    embed: "[[Abilities#Ability B]]"
```
````

All data in this example is in YAML format. Names of all elements directly correspond to terms from the game. Any value that contain some characters that can be
confusing to Obsidian can be taken in quotes (for example, parry value of +3 will be rendered as simply 3, but "+3" will be rendered exactly as written).

### Combat proficiencies

Each numeric attribute of combat proficiency, when rendered, will display a hint explaining its purpose on a mouse hover.

#### Special damage options

Special damage options that are listed in the core rules (Pierce, Seize, Break shield) will be rendered as a link that does nothing when clicked, but displays description
of this damage option as a hint on a mouse hover.

Value of a special damage option can be also an Obsidian link. It must be taken in quotes (otherwise YAML parser will be confused by brackets) and will be rendered properly.

### Fell abilities

Fell ability section can contain a "description:" or "embed:" attribute. If both are present, "description:" will be used.

"Description" attribute is expected to contain a text with ability description, and will be rendered as a plain text.

"Embed" attribute is expected to contain an Obsidian link (in quotes). It can be a link to a page, a header within a page, or a block within a page. Plugin will try to take 
the text of that page or a section of a page, strip it of any headers and render it as a piece of markdown, keeping all formatting.  

## Adversary data in page frontmatter

Some users may prefer to create pages dedicated to one adversary each, and to keep all statistics of this adversary in page frontmatter section (e.g. for it to 
be accessible to Dataview plugin). To render an adversary block from the frontmatter, codeblock of the following structure can be used:

````
```tor2e-adversary
data: frontmatter
```
````

Frontmatter of the page must contain the data for the plugin:

````
---
name: Some name
distinctive_features: 
  - Feature A
  - Feature B
attribute_level: 3
endurance: 12
might: 1
hate: 2
parry: "+3"
armour: 4d

... and so on
---
````

Any attribute added to the codeblock will override the same attribute taken from frontmatter. For example, the following block will be rendered with the Might 2
instead of 1:

````
```tor2e-adversary
data: frontmatter
might: 2
```
````

## Adversary data in frontmatter of another page

Adversary codeblock can take the data from frontmatter of another page. For this "data" attribute must contain an Obsidian link to that page (in quotes). 
This usecase also supports overridden attributes:

````
```tor2e-adversary
data: "[[My adversary]]"
name: Different name
````
