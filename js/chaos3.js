'use strict';
// Even more jokes: chatty enemies, fake achievements, emotes, fake chat, kill milestones.

ARCH[9] = { n: 'Greg (friendly! do not hurt Greg)', in: 'This is Greg. Greg is friendly. Keep Greg alive for thirty seconds. Your weapons do not know Greg is friendly.', out: 'You killed Greg. He trusted you.' };

Object.assign(QUIPS, {
  // things living enemies mutter as they walk at you
  chatter: ['hello', 'nice lantern', 'do you validate parking?', 'excuse me', 'coming through', 'is this the queue?', 'I am new here', 'we just want to talk', 'sir, this is a field', 'have you seen Greg?', 'I love my job', 'my feet hurt',
    'are we there yet', 'I was told there would be snacks', 'left, left, left right left', 'remember your training', 'I do not get paid enough', 'who are we chasing again?', 'blob blob blob', 'it is my birthday', 'one of us, one of us',
    'I am just here for the exposure', 'do not make eye contact', 'he looks tired', 'she looks tired', 'this is fine', 'why is everything on fire', 'can we talk about the dental plan', 'I think I left the gloom on', 'new phone who dis',
    'wait for meee', 'I am the main blob', 'do a barrel roll', 'it is free real estate', 'I can haz lantern?', 'so you have chosen death', 'he does not know', 'are ya winning, son?', 'big mood', 'screaming internally'],
  // what your keeper yells when you press E
  emote: ['Leeeroy... no wait, wrong game.', 'I have no idea what I am doing!', 'Witness me!', 'This is my swamp now!', 'I am doing my best!', 'For glory! And snacks!', 'Who touched my lantern?', 'I am the danger!', 'Hold my lantern.',
    'Help! Or do not! I am not your boss!', 'It is lantern time.', 'I regret everything!', 'Follow me! I am lost!', 'Stand back, I watched a tutorial!', 'Cover me, I am going in! Badly!', 'Nobody panic! I am panicking!',
    'Did anyone else leave the oven on?', 'Ten out of ten, no notes!', 'I came here to glow and chew gum, and I am all out of gum.', 'Yippee!', 'Skill issue! Mine!'],
  // fake achievements that pop up for no reason
  achievements: ['Walked ten steps', 'Opened the game', 'Looked at a blob', 'Breathed manually', 'Ignored the tutorial', 'Got hit by the slowest thing on screen', 'Stood near something', 'Pressed a button', 'Still here',
    'Blinked', 'Did not read the Boon', 'Chose violence', 'Chose violence again', 'Forgot the dash exists', 'Picked the worst card', 'Trusted a mystery box', 'Has a favourite blob', 'Touched no grass', 'Carried (allegedly)',
    'Got carried (definitely)', 'Stared at the minimap', 'Made a friend (the friend was a blob)', 'Paid rent', 'Survived a Monday', 'Committed tax fraud', 'Hydrated (unverified)', 'Read the terms and conditions (lie)',
    'Was a chicken', 'Disappointed the announcer', 'Peaked in the first minute', 'Googled the answer', 'Blamed lag', 'Blamed a teammate', 'Was the teammate', 'Circle of life enjoyer', 'Posture: shrimp', 'Speedran a mistake',
    'Collected a thing', 'Achievement hunter (this one does not count)', 'Emotional damage dealer', 'Certified menace', 'Local legend (very local)'],
  // fake stream chat for the Chat Is Typing event
  chat: ['first', 'lol', 'skill issue', 'can I have your stuff', 'mods??', 'F', 'W', 'L', 'is this scripted', 'clip that', 'bro is NOT him', 'bro IS him', 'my grandma plays better', 'pog', 'not the lantern', 'ratio',
    'unfollowed', 'chat is this real', 'he just like me fr', 'who is Greg', 'justice for Greg', 'why is it upside down', 'turn on the lights', 'ad break when', 'I am telling the deer', 'buff blobs', 'nerf keepers', 'ez', 'gg',
    'report this guy', 'I was here', 'hi youtube', 'where sound', 'too loud', 'play the other game', 'what build is this', 'ur doing it wrong', 'LETS GOOO', 'no way', 'bruh', 'chat we are so back', 'chat it is so over'],
  killMarks: { 69: 'Sixty nine kills. Nice.', 100: 'One hundred kills. They had names. You did not ask.', 420: 'Four twenty kills. Nice.', 666: 'Six hundred and sixty six. Spooky. Keep going.', 1000: 'One thousand kills. Their union rep is furious.',
    1337: 'Thirteen thirty seven. Elite numbers.', 2500: 'Twenty five hundred. This is a workplace incident now.', 5000: 'Five thousand. The Gloom is running out of interns.', 9001: 'It is over nine thousand. I had to. I am sorry.',
    15000: 'Fifteen thousand. You should talk to someone.', 25000: 'Twenty five thousand. There will be a documentary about this.' },
  timeMarks: { 69: 'One minute nine. Nice.', 260: 'Four twenty on the clock. Nice.', 404: 'Six forty four... wait. Four oh four. Joke not found.', 600: 'Ten minutes. The deer is putting on its shoes.' },
  cardTitles: ['Level up! Choose one', 'Pick one. No pressure. Everyone is waiting.', 'Choose wisely. Or do not. I am a title.', 'New toy time', 'One of these is a trap. Kidding. Maybe.', 'Level up! Do not read, just click.', 'Decisions, decisions'],
  chestTitles: ['Elite chest: a free upgrade', 'Loot! Legally obtained. Probably.', 'It dropped this. It will not need it.', 'Finders keepers: pick one'],
  boonTitles: ['The shrine is lit: choose a Boon', 'A gift from above. No returns.', 'Pick a Boon. Read the small print. There is no small print.'],
  downSelf: ['FLOOR NAP', 'YOU DIED (AGAIN)', 'SKILL ISSUE DETECTED', 'HORIZONTAL MODE', 'TACTICAL LYING DOWN', 'RESPAWNING DIGNITY... FAILED'],
  greg: ['Greg made it. Greg is going to college.', 'Greg survived. He will remember this kindness.', 'Greg is safe. Greg says thanks. Greg cannot talk, but you can tell.'],
  potato: ['Hot potato! {n} has the bomb. Give it to someone you dislike.', '{n} is holding a bomb. This is fine.'],
  potatoBoom: ['Kaboom. {n} was holding it. Thoughts and prayers.', 'And that is why we pass the potato, {n}.'],
});
QUIPS.commentary.push(
  // nature documentary
  'Here we see the keeper in its natural habitat: surrounded, and making it worse.', 'The blob is a social animal. It travels in packs, and dies in packs.', 'Observe the keeper. It has not blinked in four minutes.',
  // sat nav
  'In two hundred feet, turn left into the monsters. Recalculating.', 'You have arrived at your destination: trouble.', 'Make a U-turn. Make a U-turn. Too late.',
  // sports
  'And the crowd goes wild! There is no crowd. I am lonely.', 'What a play! I did not see it, but what a play!', 'The keeper is on fire tonight. Literally, in some cases.',
  // weather and infomercial
  "Tonight's forecast: one hundred percent chance of blobs, clearing never.", 'But wait, there is more! More blobs.', 'Tired of living? Try the purple circle!', 'Side effects of lantern use may include glowing, hubris and death.',
  // office
  'Per my last email, please stop dying.', 'Let us circle back to the part where you got hit.', 'This could have been an email.', 'We are a family here. A family that explodes blobs.',
  'Quick reminder that timesheets are due, and so are you.', 'I am going to need you to come in on Saturday. And survive.');
