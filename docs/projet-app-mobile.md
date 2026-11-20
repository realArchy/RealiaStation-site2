# Application mobile NeuroExo — dossier technique

État : **spécification classée, développement après la mise en ligne du site (mi-décembre 2026)**.
Rien n'est codé. Ce document est la base de travail de décembre.

## Cadre, à ne jamais perdre de vue

Cette application **n'est pas** le système temps réel de l'exosquelette. C'est une
application universelle, en trois espaces séparés, qui ne pilote aucun dispositif physique
et ne remplace aucun dispositif médical. Toute formulation contraire est un risque juridique.

## 1. Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| UI | **Flutter 3.x** (Dart) | un seul code pour Android et iOS, rendu identique, écosystème mature pour QR et vidéo |
| État | Riverpod | testable, pas de global mutable |
| Stockage local | Drift (SQLite) + `flutter_secure_storage` pour les jetons | offline-first, secrets dans le keystore/keychain |
| Réseau | `dio` + intercepteurs | un seul endroit pour les en-têtes, le timeout et le refus de télémétrie |
| QR | `mobile_scanner` | lecture caméra, pas de service tiers |
| Messagerie | **SDK SimpleX officiel** via platform channels (Kotlin/Swift) | c'est le seul moyen d'avoir le vrai protocole, pas une imitation |
| Boutique | API du site (WooCommerce/Stripe) | une seule source de vérité pour les prix et les dons |
| V2 vidéo | module séparé, désactivé par défaut | voir §5 |

**Point de licence à trancher avant la première ligne** : SimpleX Chat est en **AGPL-3.0**.
Intégrer son SDK dans l'application contamine l'ensemble, qui devra être publié en AGPL.
Deux sorties possibles : assumer l'AGPL (cohérent avec un projet open source), ou isoler le
moteur dans un service séparé communiquant en local. Décision à prendre en décembre, pas
après.

## 2. Arborescence

```
lib/
  app/            routeur, thème, i18n (fr/en/pt/zh), garde-fous d'écran
  core/
    config/       profils de nœuds (DevKit, RealiaStation, autre)
    crypto/       vérification de signature du QR, stockage chiffré
    net/          client HTTP unique, refus des trackers, TLS pinning optionnel
    storage/      base locale, migrations
  features/
    ai/
      domain/     Message, Conversation, Capabilities
      data/       connecteurs (voir §4), cache des modèles
      ui/         chat, réglages du nœud, appairage QR
    messaging/
      domain/     Contact, Canal
      data/       pont SimpleX (platform channel)
      ui/         liste, fil, canal « L'Architecte » épinglé
    shop/
      domain/     Produit, Don, Lien d'affiliation
      data/       API boutique, suivi des commissions
      ui/         catalogue, panier, dons Îlot Intégré, mes liens
    video/        (V2) agrégateur, filtres, lecteur sans pistage
  shared/         composants, formats, erreurs
```

Un dossier par espace : aucune dépendance croisée entre `ai`, `messaging` et `shop`.
C'est la traduction technique de « trois espaces strictement séparés ».

## 3. Payload du QR code

Deux formes : une **URI compacte** pour les QR imprimés (peu de caractères, lecture rapide),
et un **JSON** pour le partage par fichier ou lien.

URI :

```
neuroexo://pair?v=1&k=devkit&n=RealiaStation&u=https%3A%2F%2Fbox.local%3A8095&a=openai&m=qwen3.6-35b&t=TOKEN&x=1767225600&s=SIGNATURE
```

JSON :

```json
{
  "v": 1,
  "type": "neuroexo.node",
  "kind": "devkit",
  "name": "RealiaStation",
  "base_url": "https://box.local:8095",
  "api": "openai",
  "model": "qwen3.6-35b",
  "token": "…",
  "expires": 1767225600,
  "sig": "ed25519:…"
}
```

Règles :

- `v` obligatoire, refus si inconnu (pas de rétrocompatibilité devinée).
- `kind` ∈ `devkit`, `realiastation`, `custom`.
- `api` ∈ `openai`, `ollama`, `llamacpp`, `devkit`, `generic`.
- `sig` signe la concaténation canonique des champs, **hors** `sig` ; la clé publique est
  épinglée dans l'application par version majeure.
- `expires` : au-delà, l'appairage est refusé et il faut un nouveau QR.
- Le jeton n'est jamais journalisé, jamais inclus dans un rapport de plantage.

## 4. Connecteur IA agnostique

Une interface, des adaptateurs. L'écran de réglages ne propose jamais « un fournisseur » :
il propose **une URL, un modèle, une clé**, et détecte le reste.

```dart
abstract class AiProvider {
  Future<ProviderInfo> probe(Uri base, {String? token});   // /models, /props, /v1/models
  Future<List<String>> models();
  Stream<Chunk> chat(List<Msg> messages, {CancelToken? cancel});
  Capabilities get caps;                                   // streaming, tools, vision, contexte
}
```

| Adaptateur | Détection | Particularité |
|---|---|---|
| `OpenAiCompat` | `GET /v1/models` répond 200 | couvre OpenAI, OpenRouter, vLLM, LM Studio |
| `Ollama` | `GET /api/tags` | `/api/chat`, pas de clé |
| `LlamaCpp` | `GET /props` + `/completion` | contexte réel, pas de liste de modèles |
| `DevKit` | `GET /api/health` → `app: devkit` | file de tâches, modèle actif, swap |
| `RealiaStation` | `GET /api/node` → `node: realia` | multi-modèles, quotas locaux |

Le `probe` est la seule fonction obligatoire : l'application essaie les adaptateurs dans
l'ordre, garde le premier qui répond, et **affiche ce qu'elle a trouvé** — jamais une
supposition silencieuse.

## 5. V2 — lecteur vidéo souverain

Module compilé mais désactivé. Principe : un agrégateur qui interroge des sources réelles
(PeerTube, Invidious, RSS, chaîne LunaGalaxie), normalise en `VideoItem`, puis applique un
tri réglable par curseurs : thèmes prioritaires, découverte, pénalité de putaclic.
Aucun identifiant, aucune recommandation serveur, aucun historique envoyé.

## 6. Ce qui doit être décidé en décembre

1. Licence : AGPL assumée, ou moteur de messagerie isolé.
2. Comptes boutique : Stripe seul, ou Stripe + mobile money pour Madagascar.
3. Politique de mise à jour du binaire (stores vs APK direct pour les utilisateurs souverains).
4. Ce que « L'Architecte » répond automatiquement, et à partir de quand un humain prend le relais.

## 7. Ordre de développement proposé

1. Squelette Flutter + thème + i18n + navigation à trois espaces.
2. Appairage QR + `OpenAiCompat` + chat en streaming (le cœur démontrable).
3. Adaptateurs Ollama / LlamaCpp / DevKit.
4. Messagerie SimpleX et canal « L'Architecte ».
5. Boutique, dons, liens d'affiliation.
6. V2 vidéo.
