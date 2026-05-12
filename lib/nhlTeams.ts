/** NHL teams with estimated start timestamps in the combined goal-horn file.
 *  File: /sfx/nhl-goal-horns.mp3  (~643 s total, 32 teams, ~20 s each)
 *  Timestamps are evenly-spaced estimates — use the calibration panel in
 *  Settings → Hockey Horn to adjust each team to the exact second.
 */

export interface NhlTeam {
  id: string;
  name: string;
  /** Default start time in seconds within the combined MP3 */
  defaultStart: number;
  /** Approximate clip length in seconds */
  defaultDuration: number;
}

const APPROX_DURATION = 20;
const teams: NhlTeam[] = [
  { id: "anaheim-ducks",          name: "Anaheim Ducks",          defaultStart:   0, defaultDuration: APPROX_DURATION },
  { id: "boston-bruins",          name: "Boston Bruins",          defaultStart:  20, defaultDuration: APPROX_DURATION },
  { id: "buffalo-sabres",         name: "Buffalo Sabres",         defaultStart:  40, defaultDuration: APPROX_DURATION },
  { id: "calgary-flames",         name: "Calgary Flames",         defaultStart:  60, defaultDuration: APPROX_DURATION },
  { id: "carolina-hurricanes",    name: "Carolina Hurricanes",    defaultStart:  80, defaultDuration: APPROX_DURATION },
  { id: "chicago-blackhawks",     name: "Chicago Blackhawks",     defaultStart: 100, defaultDuration: APPROX_DURATION },
  { id: "colorado-avalanche",     name: "Colorado Avalanche",     defaultStart: 120, defaultDuration: APPROX_DURATION },
  { id: "columbus-blue-jackets",  name: "Columbus Blue Jackets",  defaultStart: 140, defaultDuration: APPROX_DURATION },
  { id: "dallas-stars",           name: "Dallas Stars",           defaultStart: 160, defaultDuration: APPROX_DURATION },
  { id: "detroit-red-wings",      name: "Detroit Red Wings",      defaultStart: 180, defaultDuration: APPROX_DURATION },
  { id: "edmonton-oilers",        name: "Edmonton Oilers",        defaultStart: 200, defaultDuration: APPROX_DURATION },
  { id: "florida-panthers",       name: "Florida Panthers",       defaultStart: 220, defaultDuration: APPROX_DURATION },
  { id: "los-angeles-kings",      name: "Los Angeles Kings",      defaultStart: 240, defaultDuration: APPROX_DURATION },
  { id: "minnesota-wild",         name: "Minnesota Wild",         defaultStart: 260, defaultDuration: APPROX_DURATION },
  { id: "montreal-canadiens",     name: "Montréal Canadiens",     defaultStart: 280, defaultDuration: APPROX_DURATION },
  { id: "nashville-predators",    name: "Nashville Predators",    defaultStart: 300, defaultDuration: APPROX_DURATION },
  { id: "new-jersey-devils",      name: "New Jersey Devils",      defaultStart: 320, defaultDuration: APPROX_DURATION },
  { id: "new-york-islanders",     name: "New York Islanders",     defaultStart: 340, defaultDuration: APPROX_DURATION },
  { id: "new-york-rangers",       name: "New York Rangers",       defaultStart: 360, defaultDuration: APPROX_DURATION },
  { id: "ottawa-senators",        name: "Ottawa Senators",        defaultStart: 380, defaultDuration: APPROX_DURATION },
  { id: "philadelphia-flyers",    name: "Philadelphia Flyers",    defaultStart: 400, defaultDuration: APPROX_DURATION },
  { id: "pittsburgh-penguins",    name: "Pittsburgh Penguins",    defaultStart: 420, defaultDuration: APPROX_DURATION },
  { id: "san-jose-sharks",        name: "San Jose Sharks",        defaultStart: 440, defaultDuration: APPROX_DURATION },
  { id: "seattle-kraken",         name: "Seattle Kraken",         defaultStart: 460, defaultDuration: APPROX_DURATION },
  { id: "st-louis-blues",         name: "St. Louis Blues",        defaultStart: 480, defaultDuration: APPROX_DURATION },
  { id: "tampa-bay-lightning",    name: "Tampa Bay Lightning",    defaultStart: 500, defaultDuration: APPROX_DURATION },
  { id: "toronto-maple-leafs",    name: "Toronto Maple Leafs",    defaultStart: 520, defaultDuration: APPROX_DURATION },
  { id: "utah-hockey-club",       name: "Utah Hockey Club",       defaultStart: 540, defaultDuration: APPROX_DURATION },
  { id: "vancouver-canucks",      name: "Vancouver Canucks",      defaultStart: 560, defaultDuration: APPROX_DURATION },
  { id: "vegas-golden-knights",   name: "Vegas Golden Knights",   defaultStart: 580, defaultDuration: APPROX_DURATION },
  { id: "washington-capitals",    name: "Washington Capitals",    defaultStart: 600, defaultDuration: APPROX_DURATION },
  { id: "winnipeg-jets",          name: "Winnipeg Jets",          defaultStart: 620, defaultDuration: APPROX_DURATION },
];

export const NHL_TEAMS = teams;
export const NHL_HORN_SRC = "/sfx/nhl-goal-horns.mp3";
