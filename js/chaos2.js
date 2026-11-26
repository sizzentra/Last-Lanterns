'use strict';
// More jokes: meme elites, mystery boxes, fake ads, and extra announcer lines.

// Elites now arrive as recognisable types of guy.
const ARCH = [null,
  { n: 'the Gym Bro',        in: 'A Gym Bro. Twice the health. Will tell you about it.',            out: 'The Gym Bro skipped survival day.' },
  { n: 'the Speedrunner',    in: 'A Speedrunner. It is going for a personal best on your face.',    out: 'Speedrunner down. Run invalidated.' },
  { n: 'the Landlord',       in: 'The Landlord is here. Every hit costs you rent.',                 out: 'The Landlord has been evicted. From life.' },
  { n: 'the Karen',          in: 'A Karen approaches. She has already called for backup.',          out: 'The Karen has left a one star review of dying.' },
  { n: 'the Influencer',     in: 'An Influencer. Everything near it moves faster for the content.', out: 'The Influencer has been cancelled.' },
  { n: 'the Unpaid Intern',  in: 'An Unpaid Intern. Weak, overworked, and carrying two chests.',    out: 'The Intern finally gets a day off.' },
  { n: 'the NPC',            in: 'An NPC. It is walking its route. Do not interrupt its dialogue.', out: 'The NPC will respawn after the next patch.' },
  { n: 'the One With A Final Form', in: 'This one says it has a final form. They always do.',       out: 'That was not even its final form. Here come two more.' },
];

Object.assign(QUIPS, {
  box: {
    nuke: ['Tactical nuke inbound.', 'Somebody pushed the big red button.'], chicken: ['You are a chicken now. No refunds.', 'Polymorphed. Cluck responsibly.'],
    jackpot: ['Jackpot! One hundred Embers. The house always loses. Wait.', 'It is raining money. Declare none of it.'], boon: ['A mystery Boon. Could be great. Could be a duck.'],
    swap: ['Surprise relocation!', 'You have been moved for tax purposes.'], mimic: ['The box had teeth.', 'It was a mimic. It is always a mimic.'],
    unit: ['You are an absolute unit now.', 'Large and in charge.'], shower: ['XP shower. Bring a towel.'], armor: ['Plot armor activated.', 'The writers still need you.'],
    magnet: ['Everything you dropped is yours again.'], amnesia: ['You forgot what you were doing. Have two rerolls.'], nothing: ['Congratulations! You won: nothing.', 'The box was empty. Like its promises.'],
    level: ['Instant level. Do not ask how.'], geese: ['A flock of golden geese. This is not a drill.'],
  },
  ads: [['HOT SINGLE BLOBS IN YOUR AREA', 'They are 30 feet away and closing.'], ['DOWNLOAD MORE HEALTH', 'Doctors hate this one weird lantern.'], ['YOU ARE THE 1,000,000TH VICTIM', 'Click to claim your prize: more monsters.'],
    ['LOCAL DEER HATES YOU', 'Find out why at twelve minutes.'], ['IS YOUR BUILD BAD?', 'Yes. Call now.'], ['ONE SIMPLE TRICK TO STOP DYING', 'Step one: stop dying.'], ['EXTEND YOUR LANTERN WARRANTY', 'We have been trying to reach you.'],
    ['LIMITED TIME: PREMIUM DARKNESS', 'Now 20% darker. Subscribe today.']],
  redLight: ['Red light. Do. Not. Move.', 'Freeze. I am watching you.', 'Stop. Statue time.'],
  greenLight: ['Green light. Go go go.', 'Okay, move. Quickly.'],
  caught: ['{n} moved. I saw that.', '{n} has been eliminated from the playground.', '{n} cannot stand still. Typical.'],
  circle: ['The circle is closing. Get in. This is not optional.', 'Storm incoming. Find the circle or find God.'],
  meeting: ['Emergency meeting! Everyone to the table.', 'Somebody is acting suspicious. Probably the one in the lantern.'],
  rolled: ['Fine. Here are twenty five Embers. Stop crying.', 'Okay, okay. Twenty five Embers. We are even.'],
});
QUIPS.commentary.push(
  'I have a bad feeling about this.', 'With great power comes great electricity bills.', 'You shall not pass. Sorry. Reflex.', 'May the odds be ever in somebody else\'s favour.', 'Winter is here. It brought snacks.',
  'I am going to make them an offer they cannot survive.', 'Houston, we have several problems.', 'Why so serious? You are fighting blobs.', 'To infinity and roughly a little past that.', 'I see dead blobs.',
  'You cannot handle the loot.', 'Just keep swarming. Just keep swarming.', 'This is the way. I think. I was not listening.', 'One does not simply walk out of the Gloom.', 'I am inevitable. No wait, that is the deer\'s line.',
  'It is dangerous to go alone. Take literally anyone.', 'The cake was a lie. The blobs are real.', 'Press X to doubt your build.', 'Achievement unlocked: still alive.', 'You are breathtaking. The blobs disagree.',
  'Somebody toucha my lantern.', 'Ah, I see you are a keeper of culture as well.', 'This escalated quickly.', 'Not great, not terrible.', 'Modern problems require modern lanterns.',
  'Is this a blob? No. It is a butterfly. No, it is a blob.', 'Understandable. Have a nice night.', 'Stonks. Your Embers only go up. Mostly.', 'They do not know that you are level forty.', 'Nobody: . The blobs: aaaaa.');
QUIPS.lastWords.push('I am too young to despawn', 'this was not in the tutorial', 'nerf this guy', 'I was AFK', 'gg no re', 'reported', 'lag', 'my team is trash', 'first time?', 'it is over. you have the high ground', 'I will be back',
  'I am not even supposed to be here today', 'tell the algorithm I loved it', 'big if true', 'this is why mom likes you best', 'I should have bought the battle pass', 'ratio', 'L plus ratio', 'touch grass', 'no cap that hurt', 'not very cash money of you',
  'I was just a side quest', 'bruh', 'cringe', 'you were supposed to bring balance', 'F', 'guess I will die');
QUIPS.down.push('{n} got sent to the shadow realm.', '{n} has been yeeted.', '{n} is no longer the main character.', '{n} failed the vibe check.', 'Wasted. That was {n}.', '{n} rage quit, physically.', '{n} was not the impostor. {n} was just bad.',
  'Mission failed. We will get them next time, {n}.', '{n} forgot to save.', '{n} took an arrow to the everything.');
QUIPS.bossTaunt.push('You have my permission to die.', 'I am the captain now.', 'Say hello to my little friends.', 'I find your lack of damage disturbing.', 'You are not on the list.', 'Did you read the patch notes? I got buffed.',
  'No capes, no chance.', 'I studied the blade. You studied nothing.', 'Call an ambulance. But not for me.');
QUIPS.level.push('Level up. It is over nine. That is all I am allowed to say.', 'Leveled. Stonks.', 'You have become stronger. The blobs have become a statistic.', 'New level, who dis.', 'Evolving. Please do not press B.');
QUIPS.epitaphLose.push('You were not the impostor. You were just bad.', 'Mission failed. We will get them next time.', 'This is why we cannot have nice things.', 'Have you tried the easier difficulty? It is called going outside.',
  'You died of dysentery. Close enough.', 'Game over. Insert coin. You have no coin.', 'It was at this moment you knew.');
QUIPS.epitaphWin.push('GG. No re.', 'You did it. The crowd goes mild.', 'Achievement unlocked: saw the sun.', 'Roll credits. There are no credits.');
QUIPS.camp.push('Tip: the question mark boxes are safe. Mostly. Legally we cannot promise.', 'Tonight on Last Lanterns: poor decisions, live.', 'Patch notes: we made it worse on purpose.', 'Tip: if the screen flips upside down, that is normal. You are fine. Probably.',
  'This game contains flashing lights, loud noises and geese.', 'Tip: the Landlord wants your Embers. Do not let him touch you.');
