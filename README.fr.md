# SuperCodingBall (https://www.supercodingball.com)
![icon](./src/assets/app-icons/icon-192x192.png)

*Read in [English](README.md).*

SuperCodingBall est un jeu éducatif gratuit pour les enfants de 10 ans et plus.

Le but est de découvrir la programmation avec un jeu de foot ! (c'est un excellent moyen pour des enseignants de présenter des concepts de programmation)

La programmation est faite de façon visuelle, comme dans [Scratch](https://scratch.mit.edu/), mais avec moins de blocs (il n'y a par exemple pas de "boucles").

Le joueur va entraîner une équipe de 4 footballeurs ![screenshot](./src/assets/howto/players.png)

qui vont affronter 4 monstres ![screenshot](./src/assets/howto/opponents.png).

La stratégie de l'équipe est construite avec des blocs, ensuite le match se déroule automatiquement en suivant les stratégies des deux équipes.

![screenshot](./src/assets/howto/screenshot-fr.png)

# Mobile

On peut jouer à SuperCodingBall sur mobile, tablette ou ordinateur (dans ce cas, les blocs sont affichés à côté du terrain de foot).

Sur un appareil Android ou iOS, on peut installer l'application en tant que [PWA](https://web.dev/progressive-web-apps) (ça permet de pouvoir y jouer même sans connexion).

# Offline vs online

Il y a deux modes de jeu :
* le jeu local, contre l'ordinateur (avec quelques stratégies pré-définies)
* le jeu en ligne, contre d'autres joueurs (nécessite une connexion Internet)

Pour le jeu en ligne, SuperCodingBall utilise le service [Webcom](https://datasync.orange.com) pour stocker les informations des joueurs.
C'est un service réservé aux développeurs [Orange](https://www.orange.com), mais il peut être facilement remplacé par tout autre "Backend As a Service" (comme Firebase). 

Il y a 3 options pour se connecter :
* En tant qu'invité (ne permet pas d'utiliser plusieurs appareils)
* Avec un compte Facebook
* Avec un compte Google

Dans tous les cas, SuperCodingBall va stocker le pseudo (modifiable), les blocs et les résultats des matchs joués.

À tout moment, les joueurs peuvent supprimer leur compte.

## Blockly

SuperCodingBall utilise l'excellente bibliothèque [Blockly](https://developers.google.com/blockly) de Google pour gérer les interactions avec les blocs.

Pour générer les blocs personalisés, on peut utiliser les [Blockly Developer Tools](https://blockly-demo.appspot.com/static/demos/blockfactory/index.html), la source des blocs étant stockée [ici](./src/assets/blocks/library.xml).

Une fois le fichier [blocks.json](./src/assets/blocks/blocks.json) généré, il faut le modifier pour ajouter les styles et les traductions.

## Création des sprites

Tous les sprites des joueurs viennent "l'Open Game Art Liberated Pixel Cup" et ont été générés par [cet outil](https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator) :

* Guy 1: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/#?body=Humanlike_tanned&shoes=Shoes_brown&hair=Messy_blonde&legs=Pants_red&clothes=No_sleeves_blue
* Guy 2: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/#?body=Humanlike_black&shoes=Shoes_brown&hair=Cornrows_green&legs=Pants_red&eyes=Eyes_brown&armour=Leather_blue
* Girl 1: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/#?sex=female&body=Humanlike_brown&hair=Ponytail_2_black&clothes=Sleeveless_blue&legs=Pants_red&shoes=Shoes_brown&eyes=Eyes_brown
* Girl 2: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/#?sex=female&body=Humanlike_tanned_2&hair=Long_tied_purple&clothes=Corset_lavender&legs=Pants_red&shoes=Shoes_brown&eyes=Eyes_brown
* Orc: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/#?body=Orc_green_2&legs=Pantalons_black
* Reptile: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/#?body=Reptile_lightgreen_winged&legs=Pantalons_black
* Skeleton: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/#?body=Skeleton_green&legs=Pantalons_black
* Zombie: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/#?body=Humanlike_zombie&legs=Pantalons_black&wound_ribs=Ribs_ribs&eyes=Eyes_yellow

## Traductions (pour le moment français, anglais, espagnol et russe)

Toutes les traductions sont dans le [dossier i18n](./src/assets/i18n).

N'hésitez pas à contribuer si vous voulez ajouter une autre langue !

## Genèse
SuperCodingBall a été créé pour un concours interne, mais le site est gratuit, open source et sans publicité.
