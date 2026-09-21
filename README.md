# D&D 5e Communicator

A Foundry VTT module for the **dnd5e** system that displays messages on
screen in the style of windows from games like Undertale/Deltarune —
handy for NPC radio chatter, telepathic messages, magic mirrors,
`Sending`/`Message` spells, in-world "communicator" devices, and any
other flavorful text-popup moment during a session.

This is a dnd5e-focused fork of the original *Lancer Communicator*
module: same engine and visual style, rebranded for D&D 5e, plus a
small dnd5e-specific convenience — a Communicator button right on the
actor sheet.

## Features

- Character name
- Character portrait
- Message text
- Typing sound (Undertale/Deltarune-style) selection
- Voiceover file selection (overrides the typing sound if both are set)
- Adjustable typing speed, with an auto-tune button when a voiceover is selected
- Font and font size selection
- Message box style (color themes) and width
- **Actor sheet button** *(new)* — open a dnd5e character/NPC sheet and
  click the satellite-dish icon in the window header to open the
  Communicator pre-filled with that actor's real name and portrait
- Token-tool button in the scene controls, and a `/lcm` chat command,
  both still work exactly as before
- Create a macro to replay a message later, or a per-character macro
  so you don't have to refill the fields every time for the same character
- Duplicate communicator messages to chat (optional)
- Export the session's communicator log as JSON or TXT

## Settings

- Allow players to use the communicator (token tool + actor sheet button)
- Allow players to export the chat log
- Post to chat (and whether to include attached images)
- Global typing speed / voice volume
- Text shaking on all-caps text (may false-positive on words that just
  happen to start with a capital letter)
- Debug mode (for developers)

## Compatibility

Built and verified for dnd5e v4+ on Foundry VTT v13. The core
message-popup feature has no system-specific logic and will still work
if enabled in a non-dnd5e world (as the original module did); only the
actor sheet button is dnd5e-specific and simply won't appear elsewhere.
