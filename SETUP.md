# Coffee Nomad: files and GitHub steps

## What is in the folder
- `index.html`, `styles.css`, `app.js`: the website.
- `logo.png`, `logo-dark.png`, `logo-tagline-dark.png`, `logo-tagline.png`, `mark.png`, `mark-dark.png`: your logo, cut from your brand image, in light and dark versions.
- `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`: browser tab and phone home-screen icons.
- `assets/v60-pour.mp4`, `assets/v60-poster.jpg`: your pour video (7.8 seconds, 1.2 MB) and its still frame. The homepage plays it automatically.
- `manifest.webmanifest`, `sw.js`: let visitors install the site like an app and open it offline.
- `.nojekyll`: an empty file GitHub Pages needs. Your computer may hide it (see step 4).
- `docs/` (plan and database schema), `tests/` (checks), `SETUP.md` (this file).

## Put it on GitHub for the first time
1. Sign in at github.com. Click the **+** at the top right, then **New repository**. Name it `coffee-nomad`, choose **Public**, leave everything else empty, click **Create repository**.
2. On your computer, unzip `coffee-nomad-site.zip` (right-click, Extract all).
3. In your new repository click **uploading an existing file**. Open the unzipped folder, select everything inside it (Ctrl+A on Windows, Cmd+A on Mac) and drag it onto the GitHub page. This includes the `assets`, `docs` and `tests` folders. Folder drag-and-drop works in Chrome, Edge and Firefox. Wait until every file appears in the list, scroll down and click **Commit changes**.
   - On Safari or a phone, use the free GitHub Desktop app, or upload the loose files first and then open **Add file, Upload files** again for each folder's contents.
4. Make sure `.nojekyll` is there. If you do not see it in the repository, click **Add file, Create new file**, type `.nojekyll` as the name, leave it empty and click **Commit**.
5. Go to **Settings, Pages**. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch **main**, folder **/ (root)**, then **Save**.
6. Wait one to two minutes. The address appears at the top of that page: `https://YOUR-USERNAME.github.io/coffee-nomad/`.

## Updating a site you already published
Do the same drag-and-drop in step 3. GitHub replaces files that have the same name, so you do not need to delete anything. If your repository has an old file called `coffee-nomad.html`, you can delete it. After committing, wait a minute, then reload twice (or close and reopen the page on your phone). Visitors who installed the site get the new version on their next visit.

## Check that it worked
- The browser tab shows your cup-and-pin icon, and the header shows your logo (a compact version on narrow phones, a light-coloured version in dark theme).
- The homepage plays your pour video. If you see the drawing instead, the file `assets/v60-pour.mp4` did not upload: check the `assets` folder.
- Open the site on your phone and choose "Add to Home Screen" to see the app icon.

## Run the checks (optional)
In the folder: `npm i jsdom@22 leaflet@1.9.4` then `node tests/smoke.js`. Last run: all passed in a simulated browser. They do not replace checking on real phones.

## Switch on Google sign-in (account chooser on the visitor's device)
You need a Google Cloud project. I cannot create credentials for you.
1. Google Cloud Console, **APIs and services, OAuth consent screen**: set the app name and your support email, publish it.
2. **Credentials, Create credentials, OAuth client ID**, type **Web application**.
3. Under **Authorised JavaScript origins** add `https://YOUR-USERNAME.github.io` (no path, no trailing slash).
4. Copy the client ID (ends in `.apps.googleusercontent.com`) into `CONFIG.googleClientId` at the top of `app.js`.
5. Open the site. The official Google button appears. On Android and Chrome it lists the accounts already on the device.

## Switch on Apple sign-in
Needs a paid Apple Developer account.
1. Developer account, **Identifiers**: create an App ID with Sign in with Apple, then a **Services ID** (this is your client ID).
2. Configure the Services ID: add your domain `YOUR-USERNAME.github.io` and the return URL `https://YOUR-USERNAME.github.io/coffee-nomad/`.
3. Apple gives you a file to host at `/.well-known/apple-developer-domain-association.txt`. Add it in a `.well-known` folder (the `.nojekyll` file makes GitHub serve it).
4. Put the Services ID in `CONFIG.appleServicesId` and the return URL in `CONFIG.appleRedirectUri`.
Apple shows the user's name only the first time they sign in. Some users hide their email, so Apple supplies a private relay address.

## Important security note
The page checks Google and Apple tokens in the browser to fill in the sign-up form. That is not proof of identity, because anyone can edit a page they have loaded. Real verification must happen on a server (Phase 1, step 1.4: Supabase checks the token). Until then, treat these profiles as unverified. Never put secrets or the Apple private key in `app.js`.

## What the email checks do (and do not do)
They reject: uppercase, malformed addresses, a long list of disposable-mail domains, test and reserved domains, and common typos such as `gmial.com`. They also look up the domain's mail records (through Cloudflare's public DNS service) and refuse domains that cannot receive mail.
They cannot prove the person owns the address, and a static list cannot catch every throwaway domain. Real protection comes from sending a verification email (Phase 1, step 1.3) and rate limiting on the server.

## Tests
`npm i jsdom@22` then `node tests/smoke.js`. Last run: all passed in a simulated browser. They do not replace checking on real phones.

## Your voice and music (optional)
Voice clips: put `bloom.mp3`, `pour2.mp3`, `pour3.mp3`, `swirl-drain.mp3`, `done.mp3`, `pour-all.mp3`, `skim.mp3`, `pour-gently.mp3`, `swirl.mp3`, `press.mp3`, `hiss.mp3`, `start-shot.mp3`, `stop-shot.mp3` in `audio/`.
Music: `audio/ambience.mp3` (only original or licensed tracks). Hero video: `assets/v60-pour.mp4` and `assets/v60-poster.jpg`.

## Homepage pour video (replaces the drawing automatically)
Put your own footage at `assets/v60-pour.mp4` and a still frame at `assets/v60-poster.jpg`. The page shows the video as soon as it loads and keeps the drawing as the fallback.
- **Length:** 6 to 10 seconds, 15 at most. Trim it so the last frame flows into the first (a short loop).
- **Shape:** portrait, 4:5 (for example 1080 x 1350, exported at 720 x 900 is plenty).
- **Size:** under 3 MB, 5 MB at the very most. GitHub's web upload limit is 25 MB per file, so never go near it.
- **Format:** MP4 (H.264), 24 to 30 frames per second, **no sound** (browsers only autoplay muted video).
- **Filming:** window light, steady phone, close on the bloom and the spiral pour. Avoid logos and music.
- **Poster:** one clear frame as a JPEG under 150 KB.
A longer full brew video (3 to 4 minutes) belongs in the Brew lab instead, ideally hosted on YouTube and embedded, not stored in the repository.

## Real café menus (no guessed menus)
Coffee Nomad does not show a menu unless the café has shared one. Items, prices and allergens change (Artcaffé, for example, rotates its menu with the seasons), and a wrong allergen line is a safety problem. Copying menus from delivery apps or third-party uploads would also be unreliable and unauthorised.
- **Without a supplied menu:** the Menu button explains this and offers an **Open the official menu** button that takes the visitor to the café's own website (through the "taking you to the official site" notice).
- **With a supplied menu:** the full-screen page-turning book opens, shows who supplied it and when, and lets users log drinks (caffeine is estimated from the drink name unless you give a number).
- **To add a real menu today, no backend needed:**
  1. Get the café's permission and its current menu.
  2. Copy `menus/_template.json` to, for example, `menus/artcaffe.json` and fill it in exactly as the café writes it (remove the `_readme` line).
  3. Open `menus/index.json` and add `{ "file": "artcaffe.json", "match": "art\\s*caff" }` to the list. `match` is a name pattern, so one file can cover every branch.
  4. Commit on GitHub. The menu appears for every matching café.
- In Phase 3 café owners will upload and update their own menus.

## Map and "cafés near me"
- **Use my location** centres the map on you, draws an accuracy ring, searches cafés, coffee-bean shops and roasters nearby, and sorts them nearest first. If fewer than five are close, it widens the search (1, 2, 5, then 10 km) and says so.
- Panning the map shows **Search this area**. The map key explains the pin colours.
- Data comes from OpenStreetMap through public servers. It tries several servers, waits at most 15 seconds each, keeps a saved copy for 6 hours, and shows that copy (labelled) if every server is down.
- **Coverage is the real limit:** OpenStreetMap in Kenya is incomplete, so some cafés, even well known ones, may be missing or have no opening hours. The lasting fix is a licensed places service behind your backend (Phase 2, step 2.1) plus café owners confirming their own listings.
- **Map not showing?** Open the **Map not working? Show diagnostics** panel under the map. It says which part failed (map library, map tiles, café data or location). Send me that text.
- **Better map tiles:** the page falls back through three public tile providers. For heavier traffic use a hosted provider such as MapTiler: create an account, restrict the key to your website address, then set `CONFIG.mapTileUrl` in `app.js` (for example `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=YOUR_KEY`) and add `https://api.maptiler.com` to `img-src` in the Content-Security-Policy line of `index.html`. A key in a web page is visible to visitors, so always restrict it.
