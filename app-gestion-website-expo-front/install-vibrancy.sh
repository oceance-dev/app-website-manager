#!/bin/bash

VSCODE_PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/out"
EXTENSION_PATH="/Users/oceance/.vscode/extensions/illixion.vscode-vibrancy-continued-1.1.61"

echo "Installation de Vibrancy pour macOS..."

# Vérifier si l'extension est installée
if [ ! -d "$EXTENSION_PATH" ]; then
    echo "Extension non trouvée. Veuillez l'installer d'abord."
    exit 1
fi

# Créer un backup
echo "Création d'un backup..."
sudo cp -r "$VSCODE_PATH" "$VSCODE_PATH.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null

# Appliquer les patches Vibrancy
echo "Application des patches..."
sudo node "$EXTENSION_PATH/out/extension.js" enable

echo "Terminé ! Redémarrez VSCode complètement (Cmd+Q puis relancer)"
