# Good Karma Live Suite V2

Replace the following files in your GitHub repository with the files in this folder:

- index.html
- styles.css
- app.js
- config.js
- live-board-qr.png

## One Google Sheet change

Add one column to the end of the Premium Hits tab:

`Winner`

Your complete header row should be:

Card Name | Card Number | Image URL | Status | Value | Tier | Show on Board | Celebrate | Winner

When someone pulls a premium hit:

1. Enter their Whatnot name in Winner, such as `@BuyerName`.
2. Change Status to Sold.
3. If Celebrate is Yes, the full-screen jackpot animation will appear.

Netlify will automatically update after the GitHub commit.
