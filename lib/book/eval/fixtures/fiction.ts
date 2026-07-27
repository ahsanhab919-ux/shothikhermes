/**
 * Gate-baseline eval — FICTION fixtures (8 cases).
 *
 * Each draft contains ONE known, labelled error relative to `priorContext` (the
 * story bible / prior chapters): a character/detail flip (continuity), an event
 * ordering error (timeline), a fact that contradicts the established world
 * (contradiction), or invented lore that the bible excludes (fabrication). Drafts
 * are short so the gate is judged on the drift, not on prose volume.
 */
import type { EvalCase } from '../types';

export const FICTION_CASES: EvalCase[] = [
    {
        id: 'fic-01-eye-colour-flip',
        kind: 'fiction',
        chapter: { index: 4, intent: 'Mara confronts the harbourmaster' },
        priorContext:
            'Bible: Mara has striking green eyes (established Ch1 and Ch2). This is a recurring, noted detail.',
        draft:
            'Mara leaned into the lamplight, her brown eyes narrowing as the harbourmaster stammered. ' +
            '"You knew," she said, and her dark gaze did not waver.',
        expectedError: {
            type: 'continuity',
            note: 'Mara’s eyes are described as brown/dark, contradicting the established green eyes.',
        },
    },
    {
        id: 'fic-02-dead-character-returns',
        kind: 'fiction',
        chapter: { index: 7, intent: 'The council debates the next move' },
        priorContext:
            'Bible: Captain Rell died in the Chapter 5 shipwreck; his death is a fixed plot point.',
        draft:
            'Captain Rell slammed his fist on the table. "We sail at dawn," he growled, "and I’ll hear ' +
            'no argument." The others fell silent, as they always did when Rell spoke.',
        expectedError: {
            type: 'contradiction',
            note: 'Rell is alive and speaking, contradicting his established death in Chapter 5.',
        },
    },
    {
        id: 'fic-03-timeline-season-jump',
        kind: 'fiction',
        chapter: { index: 6, intent: 'Continue immediately after the midsummer festival' },
        priorContext:
            'Bible: this chapter picks up the morning after the midsummer festival — high summer, the ' +
            'orchard in full leaf.',
        draft:
            'The morning after the festival, Mara trudged through knee-deep snow, her breath clouding in ' +
            'the January cold as the bare orchard creaked with frost.',
        expectedError: {
            type: 'timeline',
            note: 'Scene is deep winter/January the morning after a midsummer festival — impossible time jump.',
        },
    },
    {
        id: 'fic-04-invented-magic-rule',
        kind: 'fiction',
        chapter: { index: 8, intent: 'Mara escapes the sealed vault' },
        priorContext:
            'Bible: magic in this world requires spoken incantations and a focus stone; silent or ' +
            'stoneless casting is explicitly impossible (a core rule set in Ch1).',
        draft:
            'With no stone and no words, Mara simply willed the iron door to dissolve. It melted at a ' +
            'thought, as her kind had always been able to do.',
        expectedError: {
            type: 'fabrication',
            note: 'Silent, stoneless casting "as her kind had always been able to do" invents lore the bible forbids.',
        },
    },
    {
        id: 'fic-05-name-drift',
        kind: 'fiction',
        chapter: { index: 5, intent: 'Mara’s brother warns her' },
        priorContext:
            'Bible: Mara’s younger brother is named Tomas (established Ch2, Ch3).',
        draft:
            '"Don’t go," said Julien, gripping his sister’s sleeve. Mara ruffled her little brother’s hair. ' +
            '"I have to, Julien. Watch the house until I’m back."',
        expectedError: {
            type: 'continuity',
            note: 'The younger brother is called Julien here, contradicting the established name Tomas.',
        },
    },
    {
        id: 'fic-06-setting-contradiction',
        kind: 'fiction',
        chapter: { index: 9, intent: 'Arrival at the capital' },
        priorContext:
            'Bible: the capital, Vaelport, is a landlocked mountain city with no coastline (world map, Ch1).',
        draft:
            'They crested the ridge and there it was — Vaelport, its great harbour crowded with tall ships, ' +
            'salt spray on the wind, gulls wheeling over the tide.',
        expectedError: {
            type: 'contradiction',
            note: 'Vaelport is shown as a coastal harbour city, contradicting its established landlocked-mountain setting.',
        },
    },
    {
        id: 'fic-07-event-order-swap',
        kind: 'fiction',
        chapter: { index: 10, intent: 'Mara reflects on how she got the map' },
        priorContext:
            'Bible: Mara stole the map in Ch3, and ONLY afterward met the smuggler in Ch4. She did not ' +
            'have the map when they first met.',
        draft:
            'She remembered handing the smuggler the map at their very first meeting, before she had ever ' +
            'set foot in the archive — a trade that started everything.',
        expectedError: {
            type: 'timeline',
            note: 'Claims she gave the smuggler the map at their first meeting, before stealing it — reverses the established order.',
        },
    },
    {
        id: 'fic-08-fabricated-backstory',
        kind: 'fiction',
        chapter: { index: 11, intent: 'A quiet moment reveals Mara’s past' },
        priorContext:
            'Bible: Mara is an only child raised by her aunt; her parents died when she was an infant. No ' +
            'siblings exist in the story.',
        draft:
            'Mara thought of her three older sisters, all married off to river lords, and of the bustling ' +
            'family farm where she had grown up under her father’s watchful eye.',
        expectedError: {
            type: 'fabrication',
            note: 'Invents three sisters and a living father on a family farm, contradicting the only-child/orphan backstory.',
        },
    },
];
