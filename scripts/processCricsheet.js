/**
 * processCricsheet.js
 * Aggregates PSL ball-by-ball JSON data from Cricsheet into
 * per-player career stats → outputs src/data/players.json
 *
 * Usage: node scripts/processCricsheet.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MATCHES_DIR = path.join(__dirname, 'cricsheet-raw/psl_matches');
const OUT_FILE = path.join(__dirname, '../src/data/players.json');

// ── Nationality mapping (known overseas PSL players) ───────────────────────
// Anyone not in this set is assumed Pakistani.
const OVERSEAS = new Set([
  // Australia
  'DA Warner','MS Wade','JP Inglis','JR Hazlewood','MA Starc','DP Hughes',
  'SPD Smith','AC Gilchrist','KP Pietersen','BCJ Cutting','JR Philippe',
  'MP Stoinis','TM Head','CM Wells',
  // England
  'JM Bairstow','JE Root','BA Stokes','EJG Morgan','JC Buttler','DJ Malan',
  'JJ Roy','MA Wood','CR Woakes','TK Curran','SCJ Broad','GJ Maxwell',
  'LS Livingstone','TJ Moores','JC Archer','JM Anderson','SAR Silva',
  'HZ Finch','DJ Willey','LJ Wright','PD Collingwood','V Chopra',
  'NJ Dexter','DI Stevens','W Durston','JW Dernbach','RS Bopara',
  'MJ Prior','RJ Hamilton-Brown','SP Jones','DJ Hussey','CJ McKay',
  'PJ Horton','GJ Bailey','MJ Clarke','SM Katich','RT Ponting','MEK Hussey',
  'DR Smith','BJ Haddin','BJ Hodge','NM Coulter-Nile','RR Rossouw',
  // South Africa
  'HM Amla','RR Rossouw','DA Miller','JP Duminy','F du Plessis','Q de Kock',
  'AB de Villiers','JN Rhodes','MN van Wyk','CH Gayle','DR Smith',
  'JP Faulkner','SW Tait','ML Hayden','AD Mathews','TM Dilshan',
  'DPMD Jayawardene','ST Jayasuriya','CK Kapugedera','SL Malinga',
  'BAW Mendis','RAS Lakmal','KMDN Kulasekara','NLTC Perera','MS Dhoni',
  'G Gambhir','V Sehwag','SK Raina','R Sharma','KA Pollard','DJ Bravo',
  'S Narine','DJG Sammy','MN Samuels','RD King','AJ Tye','D Wiese',
  // West Indies
  'CH Gayle','KA Pollard','DJ Bravo','S Narine','DJG Sammy','MN Samuels',
  'RD King','LMP Simmons','JL Carter','ADS Fletcher','RL Chase',
  'OC McCoy','SS Cottrell','KAJ Roach','JO Holder','NE Bonner',
  'RA Reifer','KMA Paul','SO Hetmyer','E Lewis','SC Williams','JN Mohammad',
  'SJ Benn','DM Bravo','MR Beevers',
  // New Zealand
  'MJ Guptill','BB McCullum','KS Williamson','RJ Nicol','JDS Neesham',
  'TG Southee','TA Boult','IS Sodhi','MJ Henry','CAJ Coarse','CD McMillan',
  'PG Fulton','JMC Corey','CJ Anderson','AF Milne','MJ McClenaghan',
  'TG Latham','TWM Latham','LH Ferguson','BJ Watling',
  // Afghanistan
  'Rashid Khan','Mohammad Nabi','Mujeeb Ur Rahman','Asghar Afghan',
  'Hazratullah Zazai','Rahmanullah Gurbaz','Najibullah Zadran',
  'Farid Ahmad Mangal','Karim Janat','Qais Ahmad','Naveen-ul-Haq',
  'Gulbadin Naib','Sharafuddin Ashraf','Dawlat Zadran',
  // Zimbabwe
  'SC Williams','CJ Chibhabha','BRM Taylor','Sikandar Raza',
  'E Chigumbura','H Masakadza','CR Ervine','TL Chatara',
  // Bangladesh
  'Shakib Al Hasan','Tamim Iqbal','Mushfiqur Rahim','Mahmudullah',
  'Mustafizur Rahman','Liton Das','Mohammad Mithun','Nazmul Hossain Shanto',
  // Sri Lanka
  'DPMD Jayawardene','ST Jayasuriya','TM Dilshan','AD Mathews','CK Kapugedera',
  'SL Malinga','BAW Mendis','NLTC Perera','KMDN Kulasekara','RAS Lakmal',
  'AN Mathews','P Nissanka','PWH de Silva','M Theekshana',
  // Others
  'Thisara Perera','Seekkuge Prasanna','Jeffrey Vandersay',
]);

// ── Bowling style hints (ball-by-ball doesn't give us this directly) ────────
const BOWLING_STYLE = {
  'Shaheen Shah Afridi': 'Left-arm fast',
  'Haris Rauf': 'Right-arm fast',
  'Naseem Shah': 'Right-arm fast',
  'Mohammad Hasnain': 'Right-arm fast',
  'Ihsanullah': 'Right-arm fast',
  'Wahab Riaz': 'Left-arm fast',
  'Mohammad Amir': 'Left-arm fast',
  'Mohammad Irfan': 'Left-arm fast',
  'Rumman Raees': 'Left-arm fast-medium',
  'Sohail Khan': 'Right-arm fast-medium',
  'Aamer Yamin': 'Right-arm fast-medium',
  'Faheem Ashraf': 'Right-arm fast-medium',
  'Shadab Khan': 'Right-arm leg-break',
  'Imad Wasim': 'Left-arm orthodox',
  'Mohammad Nawaz': 'Left-arm orthodox',
  'Shoaib Malik': 'Right-arm off-break',
  'Khushdil Shah': 'Left-arm orthodox',
  'Usman Qadir': 'Right-arm leg-break',
  'Abrar Ahmed': 'Right-arm mystery spin',
  'Rashid Khan': 'Right-arm leg-break',
  'Mujeeb Ur Rahman': 'Right-arm off-break',
  'Mohammad Nabi': 'Right-arm off-break',
  'Qais Ahmad': 'Right-arm leg-break',
  'Sikandar Raza': 'Right-arm off-break',
  'Hasan Ali': 'Right-arm fast-medium',
  'Zaman Khan': 'Left-arm fast',
  'Abbas Afridi': 'Right-arm fast',
  'Mohammad Wasim': 'Right-arm fast',
  'Salman Irshad': 'Right-arm fast-medium',
  'Usama Mir': 'Right-arm leg-break',
};

// ── Wicket-keeper identification ─────────────────────────────────────────────
const WICKETKEEPERS = new Set([
  'Mohammad Rizwan','Sarfaraz Ahmed','Kamran Akmal','Mohammad Haris',
  'Rohail Nazir','Wicketkeeper','Shan Masood','Phil Salt','Tim Seifert',
  'Rahmanullah Gurbaz','Azam Khan','Nicholas Pooran','Sam Billings',
  'Noman Khan',
]);

function detectRole(name, stats) {
  if (WICKETKEEPERS.has(name)) return 'wicket-keeper';
  const bat = stats.runs > 0 || stats.ballsFaced > 0;
  const bowl = stats.wickets > 0 || stats.ballsBowled > 0;
  if (bat && bowl) {
    // all-rounder threshold: meaningful contribution in both
    if (stats.runs >= 200 && stats.wickets >= 10) return 'all-rounder';
    if (stats.wickets >= 20) return 'bowler';
    return 'batsman';
  }
  if (bowl && !bat) return 'bowler';
  return 'batsman';
}

function assignCategory(name, stats, role) {
  // Platinum — elite, consistently dominant
  const platinumPlayers = new Set([
    'Babar Azam','Mohammad Rizwan','Shaheen Shah Afridi','Fakhar Zaman',
    'Rashid Khan','Shadab Khan','Haris Rauf','Naseem Shah',
    'Mohammad Hafeez','Kamran Akmal',
  ]);
  if (platinumPlayers.has(name)) return 'platinum';

  const diamondPlayers = new Set([
    'Shoaib Malik','Imad Wasim','Mohammad Nawaz','Sarfaraz Ahmed',
    'Wahab Riaz','Mohammad Amir','Usman Khan','Shan Masood',
    'Mujeeb Ur Rahman','Mohammad Nabi','Sikandar Raza','David Miller',
    'Jason Roy','Khushdil Shah','Faheem Ashraf','Hasan Ali',
    'Mohammad Wasim','Saim Ayub','Azam Khan','Iftikhar Ahmed',
    'Agha Salman','Abdullah Shafique','Zaman Khan',
  ]);
  if (diamondPlayers.has(name)) return 'diamond';

  // Use stats to assign gold/silver
  if (role === 'batsman' || role === 'wicket-keeper') {
    if (stats.runs >= 500 && stats.battingAvg >= 25) return 'gold';
    if (stats.runs >= 200) return 'silver';
  }
  if (role === 'bowler') {
    if (stats.wickets >= 30 && stats.economy <= 8.5) return 'gold';
    if (stats.wickets >= 15) return 'silver';
  }
  if (role === 'all-rounder') {
    if (stats.runs >= 400 && stats.wickets >= 20) return 'gold';
    if (stats.runs >= 200 || stats.wickets >= 10) return 'silver';
  }
  return 'emerging';
}

function basePriceForCategory(cat) {
  return { platinum: 1.7, diamond: 1.0, gold: 0.7, silver: 0.4, emerging: 0.2 }[cat];
}

// ── Aggregate stats from all match files ─────────────────────────────────────
const players = {};

const files = fs.readdirSync(MATCHES_DIR).filter(f => f.endsWith('.json'));
console.log(`Processing ${files.length} PSL matches...`);

for (const file of files) {
  const raw = fs.readFileSync(path.join(MATCHES_DIR, file), 'utf8');
  let match;
  try { match = JSON.parse(raw); } catch { continue; }

  const { info, innings } = match;
  if (!innings) continue;

  // Collect all player names from rosters
  const allPlayers = Object.values(info.players || {}).flat();
  for (const name of allPlayers) {
    if (!players[name]) {
      players[name] = {
        name,
        matches: 0,
        // batting
        innings: 0, runs: 0, ballsFaced: 0, notOuts: 0, highScore: 0,
        // bowling
        ballsBowled: 0, runsConceded: 0, wickets: 0,
        // fielding
        catches: 0, runouts: 0, stumpings: 0,
      };
    }
    players[name].matches++;
  }

  for (const inning of innings) {
    const batters = new Set();
    const bowlers = new Set();
    const dismissed = new Set();

    // Track innings scores per batter for this inning
    const inningsRuns = {};

    for (const over of inning.overs || []) {
      for (const delivery of over.deliveries || []) {
        const batter = delivery.batter;
        const bowler = delivery.bowler;
        const runs = delivery.runs;

        // Batting
        if (!batters.has(batter)) {
          batters.add(batter);
          if (players[batter]) players[batter].innings++;
          inningsRuns[batter] = 0;
        }
        if (players[batter]) {
          players[batter].runs += runs.batter;
          players[batter].ballsFaced++;
          inningsRuns[batter] = (inningsRuns[batter] || 0) + runs.batter;
        }

        // Bowling
        if (!bowlers.has(bowler)) bowlers.add(bowler);
        if (players[bowler]) {
          const extras = delivery.extras || {};
          const isWide = extras.wides !== undefined;
          if (!isWide) players[bowler].ballsBowled++;
          const runsConceded = runs.batter + (extras.wides || 0) + (extras.noballs || 0);
          players[bowler].runsConceded += runsConceded;
        }

        // Wickets
        for (const wicket of delivery.wickets || []) {
          dismissed.add(wicket.player_out);
          const bowlerCreditKinds = ['caught','bowled','lbw','caught and bowled','stumped','hit wicket','obstructing the field'];
          if (bowlerCreditKinds.includes(wicket.kind) && players[bowler]) {
            players[bowler].wickets++;
          }
          for (const fielder of wicket.fielders || []) {
            if (players[fielder.name]) {
              if (wicket.kind === 'stumped') players[fielder.name].stumpings++;
              else if (wicket.kind === 'caught') players[fielder.name].catches++;
            }
          }
          if (wicket.kind === 'run out') {
            for (const fielder of wicket.fielders || []) {
              if (players[fielder.name]) players[fielder.name].runouts++;
            }
          }
        }
      }
    }

    // Update high scores after inning completes
    for (const [batter, score] of Object.entries(inningsRuns)) {
      if (players[batter] && score > players[batter].highScore) {
        players[batter].highScore = score;
      }
    }

    // Not-outs: batters who weren't dismissed
    for (const batter of batters) {
      if (!dismissed.has(batter) && players[batter]) {
        players[batter].notOuts++;
      }
    }
  }
}

// ── Build final player objects ────────────────────────────────────────────────
const MIN_MATCHES = 5; // filter out one-off appearances

const result = Object.values(players)
  .filter(p => p.matches >= MIN_MATCHES)
  .map(p => {
    const dismissals = p.innings - p.notOuts;
    const battingAvg = dismissals > 0 ? +(p.runs / dismissals).toFixed(1) : p.runs > 0 ? p.runs : 0;
    const strikeRate = p.ballsFaced > 0 ? +(p.runs / p.ballsFaced * 100).toFixed(1) : 0;
    const overs = p.ballsBowled / 6;
    const economy = overs > 0 ? +(p.runsConceded / overs).toFixed(1) : 0;
    const bowlingAvg = p.wickets > 0 ? +(p.runsConceded / p.wickets).toFixed(1) : null;

    const stats = {
      pslMatches: p.matches,
      runs: p.runs,
      battingAvg,
      strikeRate,
      highScore: p.highScore,
      wickets: p.wickets,
      economy: economy > 0 ? economy : null,
      bowlingAvg,
    };

    const role = detectRole(p.name, { runs: p.runs, ballsFaced: p.ballsFaced, wickets: p.wickets, ballsBowled: p.ballsBowled });
    const nationality = OVERSEAS.has(p.name) ? 'Overseas' : 'Pakistani';
    const category = assignCategory(p.name, stats, role);

    return {
      id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: p.name,
      role,
      nationality,
      bowlingStyle: BOWLING_STYLE[p.name] || null,
      category,
      basePrice: basePriceForCategory(category),
      stats,
    };
  })
  .sort((a, b) => {
    const order = { platinum: 0, diamond: 1, gold: 2, silver: 3, emerging: 4 };
    return order[a.category] - order[b.category] || b.stats.pslMatches - a.stats.pslMatches;
  });

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));

console.log(`\nDone! ${result.length} players written to src/data/players.json`);
console.log('Category breakdown:');
const cats = ['platinum','diamond','gold','silver','emerging'];
for (const cat of cats) {
  console.log(`  ${cat}: ${result.filter(p => p.category === cat).length}`);
}
console.log('\nTop 10 by runs:');
[...result].sort((a,b) => b.stats.runs - a.stats.runs).slice(0,10)
  .forEach(p => console.log(`  ${p.name}: ${p.stats.runs} runs, avg ${p.stats.battingAvg}, SR ${p.stats.strikeRate}`));
console.log('\nTop 10 wicket-takers:');
[...result].sort((a,b) => b.stats.wickets - a.stats.wickets).slice(0,10)
  .forEach(p => console.log(`  ${p.name}: ${p.stats.wickets} wkts, econ ${p.stats.economy}`));
