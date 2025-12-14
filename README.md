# Changes Made in This Fork
## Modify Banner Conversion Target
- Originally, I had to select some texts in order to create a banner.
- it's lowkey annoying (plus missing a single text breaks the banner)
- Furthermore, this extension doesn't actually allow me to create multi-line banners.
- Which makes text selection kinda meaningless???
- So I modified the extension to just convert the entire line into a banner.
## Delete Text Extraction Functions
- I don't think I'll ever try converting an existing banner into a new one.
- Therefore, I ended up removing some related functions and format checks.
- RIP to your carefully written code, D0n-A!
## Append Mirrored Prefix (Suffix)
- When manually adding a line seperator, I usually append the comment prefix at the end so it looks symmetric.
- So why not for banners?
- Inner width calculation formula has also been modified.