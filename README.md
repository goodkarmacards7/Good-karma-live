# Good Karma Live Suite

This is the full live control center for your Whatnot mystery-pack stream.

## What it does

- Shows only premium hits marked for display
- Pulls card names, pictures, values, tiers, and status from Google Sheets
- Marks sold/pulled cards with a large red X
- Shows packs remaining, packs sold, live hit count, top remaining chase, recent hit, and total premium hits
- Refreshes automatically
- Plays a full-screen BIG HIT celebration when a newly pulled card has Celebrate = Yes
- Works on iPhone, laptop, TV, or OBS once hosted

## Google Sheet setup

Create one Google Sheet with two tabs.

### Tab 1: Premium Hits

Use this exact header row:

Card Name	Card Number	Image URL	Status	Value	Tier	Show on Board	Celebrate

Example:

Greninja ex	214/167	https://images.pokemontcg.io/sv6/214_hires.png	Available	$225	Top Chase	Yes	Yes
Charizard ex	199/165	https://images.pokemontcg.io/sv3pt5/199_hires.png	Available	$115	Chase	Yes	Yes
Pikachu	173/165	https://images.pokemontcg.io/sv3pt5/173_hires.png	Sold	$45	Premium IR	Yes	No

Status values that trigger the red X:
- Sold
- Pulled
- Claimed

Show on Board values:
- Yes
- Y
- True
- 1
- Show

Celebrate values:
- Yes
- Y
- True
- 1

### Tab 2: Stream Stats

Use this exact layout:

Key	Value
Packs Remaining	86
Packs Sold	14
Stream Note	Every pack contains an Illustration Rare or better.

## Connect the website

1. Make the Google Sheet viewable to anyone with the link, or publish the two tabs.
2. Open config.js.
3. Paste the spreadsheet ID into sheetId.
4. Open each tab in Google Sheets and copy the number after gid= in the URL.
5. Put the Premium Hits gid into hitsGid.
6. Put the Stream Stats gid into statsGid.
7. Save config.js.

## Put it on GitHub

1. Create a free GitHub account.
2. Create a new repository called good-karma-live.
3. Upload all files from this folder.
4. Commit the files.

## Connect GitHub to Netlify

1. Sign in to Netlify.
2. Choose Add new site.
3. Choose Import an existing project.
4. Choose GitHub.
5. Select the good-karma-live repository.
6. Leave the build command blank.
7. Leave the publish directory blank or set it to /
8. Deploy.

After that, any future change committed to GitHub updates the live site automatically.

## Important privacy note

Only use a public display-only Google Sheet. Do not include purchase cost, customer details, receipts, accounting notes, or anything private.
