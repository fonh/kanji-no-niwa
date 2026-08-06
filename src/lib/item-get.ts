// Scène « objet obtenu » (2026-08-06) — logique pure, zéro I/O.
//
// POURQUOI
// --------
// Constaté en jeu : « je récupère le Pokédex et rien ne se passe ». Le
// `grant_item` entrait bien l'objet au Sac, mais silencieusement — pas de
// jingle, pas de ligne, aucune explication de ce qu'on venait de recevoir. Le
// joueur repartait sans savoir qu'il avait quelque chose, ni quoi.
//
// Le jeu d'origine en fait toujours une scène de trois temps (décompilé, p. ex.
// scr_seq_0850_T21.s pour les Running Shoes de Ville Griotte) :
//
//     NPCMsg   « {joueur} received the Running Shoes from the Guide Gent! »
//     PlayFanfare SEQ_ME_ITEM   (ou SEQ_ME_KEYITEM pour un objet-clé)
//     WaitFanfare
//     NPCMsg   « The instructions read, "Touch the Sprint Button…" »
//
// — l'annonce, la fanfare pendant qu'elle est à l'écran, puis à quoi ça sert.
// Les messages standard de la ROM ajoutent la poche :
// « {joueur} put the {objet} in the {poche} Pocket. » (msg_0210_00009).
//
// CE QUI EST FAIT ICI, ET POURQUOI C'EST GÉNÉRIQUE
// ------------------------------------------------
// Ces pages sont fabriquées à partir des `Effect.grant_item` du dialogue
// atteint, côté serveur, pour TOUS les chemins d'interaction (parler, verrou
// qui délègue, objet ramassé). Écrire un `grant_item` suffit donc pour qu'un
// objet soit annoncé, rangé et expliqué : rien à recopier par PNJ, et un objet
// ajouté dans dix zones plus loin hérite du même traitement. C'est la demande
// explicite : « tout ça faut que ça s'applique aussi quand tu scaleras ».
//
// La description vient de src/data/item-labels.json (`jp_description`), la
// poche de sa `category`. Un objet sans libellé n'a pas de scène du tout —
// mieux vaut rien qu'une page 「？？？」 : c'est le trou que
// audit-first-gym-run.py refuse déjà sur le chemin critique.

import type { DialoguePageEntry } from './content'
import type { BagItemLabels } from './start-menu'

/** Fanfare du jeu d'origine à jouer sur la page d'annonce. */
export type ItemFanfare = 'item' | 'keyitem'

/** Poches dont le contenu est un objet-clé : le jeu d'origine leur réserve
 * SEQ_ME_KEYITEM, un jingle plus long et plus solennel que SEQ_ME_ITEM. */
const KEY_ITEM_CATEGORIES = new Set(['key_items', 'cs_kanji'])

export interface ItemGetPage extends Record<string, unknown> {
  kind: 'item_get'
  item_id: string
  /** 「ポケモンずかんを　てにいれた！」 */
  jp: string
  en: string
  fanfare: ItemFanfare
}

/** Les pages à ajouter derrière un dialogue qui remet des objets.
 *
 * Trois pages par objet, dans l'ordre du jeu d'origine : annonce (avec la
 * fanfare), rangement (la poche), explication. Les deux dernières sont des
 * pages de texte ordinaires — seule l'annonce porte le `kind`, parce que seule
 * elle déclenche un son.
 */
export function buildItemGetPages(
  itemIds: readonly string[],
  labels: BagItemLabels
): DialoguePageEntry[] {
  const pages: DialoguePageEntry[] = []
  for (const itemId of itemIds) {
    const label = labels.items[itemId]
    if (!label) continue
    const pocket = labels.categories.find(c => c.id === label.category)
    const fanfare: ItemFanfare = KEY_ITEM_CATEGORIES.has(label.category) ? 'keyitem' : 'item'
    pages.push({
      kind: 'item_get',
      item_id: itemId,
      jp: `${label.jp}を　てにいれた！`,
      en: `Obtained the ${itemId}!`,
      fanfare,
    } satisfies ItemGetPage)
    if (pocket) {
      pages.push({
        jp: `${label.jp}を　${pocket.jp}に　いれた。`,
        en: `Put it in the ${pocket.id} pocket.`,
      })
    }
    if (label.jp_description) {
      pages.push({ jp: label.jp_description, en: '' })
    }
  }
  return pages
}

/** Les `item_id` qu'un jeu d'Effect remet, dans l'ordre, sans doublon.
 *
 * `grant_item` est idempotent pour un objet unique : le relire ne redonne
 * rien. La scène ne doit donc se jouer que si l'objet ENTRE réellement au
 * Sac — d'où la comparaison des inventaires avant/après, plutôt qu'une lecture
 * naïve des Effects (sinon reparler à Mr. Pokémon rejouerait la remise de
 * l'œuf à chaque fois).
 */
export function newlyGrantedItems(
  before: Readonly<Record<string, number>>,
  after: Readonly<Record<string, number>>
): string[] {
  return Object.keys(after).filter(itemId => (after[itemId] ?? 0) > (before[itemId] ?? 0))
}
