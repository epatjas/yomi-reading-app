#!/bin/bash

# Create directory if it doesn't exist
mkdir -p assets/fonts

# Download SF Pro Rounded fonts
echo "Downloading SF Pro Rounded fonts..."
curl -L -o assets/fonts/SFProRounded_400Regular.ttf "https://github.com/AllThingsSmitty/fonts/raw/master/fonts/SF-Pro-Rounded-Regular.ttf"
curl -L -o assets/fonts/SFProRounded_500Medium.ttf "https://github.com/AllThingsSmitty/fonts/raw/master/fonts/SF-Pro-Rounded-Medium.ttf"
curl -L -o assets/fonts/SFProRounded_600SemiBold.ttf "https://github.com/AllThingsSmitty/fonts/raw/master/fonts/SF-Pro-Rounded-Semibold.ttf"
curl -L -o assets/fonts/SFProRounded_700Bold.ttf "https://github.com/AllThingsSmitty/fonts/raw/master/fonts/SF-Pro-Rounded-Bold.ttf"

echo "All fonts downloaded successfully!" 