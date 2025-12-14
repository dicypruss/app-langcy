# Language Learning Telegram Bot

A Telegram bot designed to help users learn languages through daily interactive exercises, similar to Duolingo but within the Telegram interface.

## Goal
To provide a convenient and engaging way for users to practice language skills throughout the day using short, focused assignments.

## Features
The bot sends assignments and exercises to the user during the day in test form, including:
- **Audio Assignments**: Listen to an audio clip and pick the correct translation from given options.
- **Vocabulary Practice**: Translate foreign words.
- **Fill-in-the-Blanks**: Complete sentences by choosing the correct option from a list.

## Running Locally

1.  Clone the repository:
    ```bash
    git clone https://github.com/dicypruss/app-langcy.git
    cd app-langcy
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the root directory and add your Telegram Bot Token:
    ```text
    TELEGRAM_BOT_TOKEN=your_token_here
    ```

4.  Start the bot:
    ```bash
    node index.js
    ```

5.  Open your bot in Telegram and send `/start`. It should reply with a welcome message. Send any text to see it echoed back.
