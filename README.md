# PoE2 PoB Copy Button

[日本語](README.ja.md)

## Overview

This extension adds a "PoB Copy" button to Path of Exile 2 trade results.
Clicking the button copies a full item text format that can be pasted into
Path of Building 2 (Create Custom).
It also works while browsing the trade site in non-English languages.

## Install (Release Build)

1. Download `poe2-pob-copy-button-dist.zip` from the GitHub Releases page.
2. Extract the zip to a local folder.
3. Open Chrome and go to `chrome://extensions/`.
4. Enable "Developer mode".
5. Click "Load unpacked" and select the extracted folder.

## Screenshot

![PoB Copy Button on trade results](doc/assets/trade-result.png)

## Usage

1. Open the PoE2 trade search page:
   `https://pathofexile.com/trade2/search/poe2`
2. Each result row shows a "PoB Copy" button.
3. Click it to copy the full item text to the clipboard.
4. Paste into Path of Building 2 -> Create Custom.

## Notes

- The extension fetches English item data in the background for non-English
  domains to ensure PoB-compatible text.
- If data is not yet cached, the button shows "Failed".
  Re-click after the data fetch completes.

## License

MIT License (see `LICENSE`)
